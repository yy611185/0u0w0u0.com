import { describe, expect, it } from 'vitest'
import { buildCollection, parseNote } from './shared'

function noteSource(overrides: { slug?: string; draft?: boolean; body?: string } = {}): string {
  return `---
title: 测试笔记
slug: ${overrides.slug ?? 'test-note'}
date: 2026-09-01
updated: 2026-09-02
description: 一条用于验证内容层的说明。
tags:
  - 测试
draft: ${String(overrides.draft ?? false)}
---

${overrides.body ?? '这是一段正文。'}`
}

describe('content parsing', () => {
  it('parses validated frontmatter and calculates reading time', () => {
    const note = parseNote(noteSource({ body: '字'.repeat(301) }), 'test.md')

    expect(note.slug).toBe('test-note')
    expect(note.tags).toEqual(['测试'])
    expect(note.readingTime).toBe(2)
    expect(note.content).toContain('<p>')
  })

  it('rejects malformed frontmatter and unsafe slugs', () => {
    expect(() => parseNote('没有 frontmatter', 'broken.md')).toThrow('invalid frontmatter')
    expect(() => parseNote(noteSource({ slug: 'Not Safe' }), 'slug.md')).toThrow('not URL safe')
  })

  it('rejects duplicate slugs', () => {
    const first = parseNote(noteSource(), 'first.md')
    const second = parseNote(noteSource(), 'second.md')

    expect(() => buildCollection([first, second], 'note', false)).toThrow('duplicate note slug')
  })

  it('filters drafts in production mode and sorts newest first', () => {
    const published = parseNote(noteSource({ slug: 'published' }), 'published.md')
    const draft = parseNote(noteSource({ slug: 'draft', draft: true }), 'draft.md')
    const collection = buildCollection([draft, published], 'note', false)

    expect(collection.all().map((note) => note.slug)).toEqual(['published'])
    expect(collection.bySlug('draft')).toBeUndefined()
  })
})
