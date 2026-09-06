import MarkdownIt from 'markdown-it'
import type { ImageAsset } from '../data'

export type ContentKind = 'note' | 'project' | 'lab'

export type BaseContent = {
  title: string
  slug: string
  description: string
  date: string
  updated: string
  draft: boolean
  content: string
  readingTime: number
}

export type Note = BaseContent & { tags: string[] }

export type Project = BaseContent & {
  tagline: string
  cover: ImageAsset
  tags: string[]
  status: 'active' | 'complete' | 'archived'
  repository?: string
  demo?: string
  stack: string[]
  featured: boolean
}

export type LabItem = BaseContent & {
  status: 'LIVE' | 'BETA' | 'WIP'
  stack: string[]
  emoji: string
}

type Frontmatter = Record<string, string | boolean | string[]>

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
})

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const COMMON_KEYS = ['title', 'slug', 'description', 'date', 'updated', 'draft'] as const

function scalar(value: string): string | boolean {
  const clean = value.trim()
  if (clean === 'true') return true
  if (clean === 'false') return false
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    return clean.slice(1, -1)
  }
  return clean
}

export function parseSource(source: string, file: string) {
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) throw new Error(`[content] ${file}: missing or invalid frontmatter`)
  const [, frontmatter = '', body = ''] = match

  const data: Frontmatter = {}
  let listKey: string | undefined
  for (const original of frontmatter.split('\n')) {
    const line = original.trimEnd()
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    const item = line.match(/^\s+-\s+(.+)$/)
    if (item && listKey) {
      const values = data[listKey]
      if (!Array.isArray(values)) throw new Error(`[content] ${file}: invalid list for ${listKey}`)
      values.push(String(scalar(item[1] ?? '')))
      continue
    }
    const field = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:\s*(.*))?$/)
    if (!field) throw new Error(`[content] ${file}: unsupported frontmatter line "${line}"`)
    const [, key = '', value = ''] = field
    if (!value.trim()) {
      data[key] = []
      listKey = key
    } else {
      data[key] = scalar(value)
      listKey = undefined
    }
  }
  return { data, body: body.trim() }
}

function assertKnownKeys(data: Frontmatter, keys: readonly string[], file: string) {
  const allowed = new Set(keys)
  for (const key of Object.keys(data)) {
    if (!allowed.has(key))
      throw new Error(`[content] ${file}: unsupported frontmatter field "${key}"`)
  }
}

function requiredString(data: Frontmatter, key: string, file: string) {
  const value = data[key]
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`[content] ${file}: ${key} must be a non-empty string`)
  return value.trim()
}

function requiredBoolean(data: Frontmatter, key: string, file: string) {
  const value = data[key]
  if (typeof value !== 'boolean') throw new Error(`[content] ${file}: ${key} must be true or false`)
  return value
}

function optionalString(data: Frontmatter, key: string) {
  const value = data[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function optionalHttpUrl(data: Frontmatter, key: string, file: string) {
  const value = optionalString(data, key)
  if (!value) return undefined

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`[content] ${file}: ${key} must be a valid http(s) URL`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    throw new Error(`[content] ${file}: ${key} must be a valid http(s) URL`)
  return value
}

function stringList(data: Frontmatter, key: string, file: string) {
  const value = data[key]
  if (!Array.isArray(value)) throw new Error(`[content] ${file}: ${key} must be a YAML list`)
  const items = value.map((item) => item.trim())
  if (items.some((item) => !item))
    throw new Error(`[content] ${file}: ${key} must not contain empty values`)
  return items
}

function validDate(value: string) {
  const match = value.match(DATE)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

function common(source: string, file: string) {
  const { data, body } = parseSource(source, file)
  const slug = requiredString(data, 'slug', file)
  const date = requiredString(data, 'date', file)
  const updated = requiredString(data, 'updated', file)
  if (!SLUG.test(slug)) throw new Error(`[content] ${file}: slug "${slug}" is not URL safe`)
  if (!validDate(date) || !validDate(updated))
    throw new Error(`[content] ${file}: date and updated must be real dates using YYYY-MM-DD`)
  if (updated < date) throw new Error(`[content] ${file}: updated must not be earlier than date`)
  const draft = requiredBoolean(data, 'draft', file)
  const plain = body
    .replace(/[`#>*_\[\]()!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const units =
    (plain.match(/[\u3400-\u9fff]/g)?.length ?? 0) + plain.split(/\s+/).filter(Boolean).length
  return {
    data,
    base: {
      title: requiredString(data, 'title', file),
      slug,
      description: requiredString(data, 'description', file),
      date,
      updated,
      draft,
      content: markdown.render(body),
      readingTime: Math.max(1, Math.ceil(units / 300))
    } satisfies BaseContent
  }
}

export function parseNote(source: string, file: string): Note {
  const { data, base } = common(source, file)
  assertKnownKeys(data, [...COMMON_KEYS, 'tags'], file)
  return { ...base, tags: stringList(data, 'tags', file) }
}

export function parseProject(
  source: string,
  file: string,
  covers: Record<string, ImageAsset>
): Project {
  const { data, base } = common(source, file)
  assertKnownKeys(
    data,
    [
      ...COMMON_KEYS,
      'tagline',
      'cover',
      'tags',
      'status',
      'repository',
      'demo',
      'stack',
      'featured'
    ],
    file
  )
  const coverKey = requiredString(data, 'cover', file)
  const cover = covers[coverKey]
  if (!cover) throw new Error(`[content] ${file}: unknown cover "${coverKey}"`)
  const status = requiredString(data, 'status', file)
  if (!['active', 'complete', 'archived'].includes(status))
    throw new Error(`[content] ${file}: invalid project status "${status}"`)
  return {
    ...base,
    tagline: requiredString(data, 'tagline', file),
    cover,
    tags: stringList(data, 'tags', file),
    status: status as Project['status'],
    repository: optionalHttpUrl(data, 'repository', file),
    demo: optionalHttpUrl(data, 'demo', file),
    stack: stringList(data, 'stack', file),
    featured: requiredBoolean(data, 'featured', file)
  }
}

export function parseLabItem(source: string, file: string): LabItem {
  const { data, base } = common(source, file)
  assertKnownKeys(data, [...COMMON_KEYS, 'status', 'stack', 'emoji'], file)
  const status = requiredString(data, 'status', file)
  if (!['LIVE', 'BETA', 'WIP'].includes(status))
    throw new Error(`[content] ${file}: invalid lab status "${status}"`)
  return {
    ...base,
    status: status as LabItem['status'],
    stack: stringList(data, 'stack', file),
    emoji: requiredString(data, 'emoji', file)
  }
}

export function buildCollection<T extends BaseContent>(
  items: T[],
  kind: ContentKind,
  includeDrafts = import.meta.env.DEV
) {
  const bySlug = new Map<string, T>()
  for (const item of items) {
    if (bySlug.has(item.slug)) throw new Error(`[content] duplicate ${kind} slug: "${item.slug}"`)
    bySlug.set(item.slug, item)
  }
  const visible = items
    .filter((item) => includeDrafts || !item.draft)
    .sort((a, b) => b.date.localeCompare(a.date))
  return {
    all: () => visible,
    bySlug: (slug: string) => visible.find((item) => item.slug === slug)
  }
}
