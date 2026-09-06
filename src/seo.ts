import type { LabItem, Note, Project } from './content'
import { SITE } from './data'

export type PageMeta = {
  title?: string
  description?: string
  canonical?: string
  image?: string
  type?: 'website' | 'article'
  robots?: string
}

export type ResolvedPageMeta = Required<Omit<PageMeta, 'robots'>> & {
  robots: string
}

export const STATIC_ROUTES = [
  '/',
  '/projects',
  '/notes',
  '/lab',
  '/photos',
  '/about',
  '/now'
] as const

export function canonicalPath(path: string): string {
  if (!path || path === '/') return '/'
  const clean = path.split(/[?#]/, 1)[0] ?? '/'
  return `/${clean.replace(/^\/+|\/+$/g, '')}`
}

export function absoluteUrl(path: string): string {
  return new URL(canonicalPath(path), SITE.url).toString()
}

export function resolvePageMeta(meta: PageMeta, requestPath: string): ResolvedPageMeta {
  return {
    title: meta.title ? `${meta.title} — ${SITE.name}` : SITE.title,
    description: meta.description ?? SITE.description,
    canonical: absoluteUrl(meta.canonical ?? requestPath),
    image: new URL(meta.image ?? '/static/assets/og-image.jpg', SITE.url).toString(),
    type: meta.type ?? 'website',
    robots: meta.robots ?? 'index, follow'
  }
}

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function latestDate(items: Array<{ updated: string }>): string | undefined {
  return items
    .map((item) => item.updated)
    .sort()
    .at(-1)
}

export function buildSitemap(notes: Note[], projects: Project[], labItems: LabItem[]): string {
  const publishedNotes = notes.filter((note) => !note.draft)
  const publishedProjects = projects.filter((project) => !project.draft)
  const publishedLabItems = labItems.filter((item) => !item.draft)
  const entries: Array<{ path: string; updated?: string }> = [
    {
      path: '/',
      updated: latestDate([...publishedNotes, ...publishedProjects, ...publishedLabItems])
    },
    { path: '/projects', updated: latestDate(publishedProjects) },
    ...publishedProjects.map((project) => ({
      path: `/projects/${project.slug}`,
      updated: project.updated
    })),
    { path: '/notes', updated: latestDate(publishedNotes) },
    ...publishedNotes.map((note) => ({ path: `/notes/${note.slug}`, updated: note.updated })),
    { path: '/lab', updated: latestDate(publishedLabItems) },
    ...publishedLabItems.map((item) => ({ path: `/lab/${item.slug}`, updated: item.updated })),
    { path: '/photos' },
    { path: '/about' },
    { path: '/now' }
  ]
  const urls = entries
    .map(
      ({ path, updated }) =>
        `  <url>\n    <loc>${xml(absoluteUrl(path))}</loc>${updated ? `\n    <lastmod>${updated}</lastmod>` : ''}\n  </url>`
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export function buildRss(notes: Note[]): string {
  const items = notes
    .filter((note) => !note.draft)
    .map((note) => {
      const link = absoluteUrl(`/notes/${note.slug}`)
      const pubDate = new Date(`${note.date}T00:00:00Z`).toUTCString()
      return `    <item>\n      <title>${xml(note.title)}</title>\n      <link>${xml(link)}</link>\n      <guid isPermaLink="true">${xml(link)}</guid>\n      <pubDate>${pubDate}</pubDate>\n      <description>${xml(note.description)}</description>\n    </item>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${xml(SITE.title)}</title>\n    <link>${xml(SITE.url)}</link>\n    <description>${xml(SITE.description)}</description>\n    <language>zh-CN</language>\n${items}\n  </channel>\n</rss>\n`
}

export function buildRobots(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`
}
