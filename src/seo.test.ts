import { describe, expect, it } from 'vitest'
import { parseNote } from './content'
import {
  absoluteUrl,
  buildRobots,
  buildRss,
  buildSitemap,
  canonicalPath,
  resolvePageMeta
} from './seo'

function note(draft = false) {
  return parseNote(
    `---
title: A & B
slug: ${draft ? 'draft-note' : 'published-note'}
date: 2026-09-01
updated: 2026-09-03
description: <内容> & 说明
tags:
  - SEO
draft: ${String(draft)}
---
正文`,
    'seo.md'
  )
}

describe('SEO helpers', () => {
  it('normalizes canonical paths and produces production URLs', () => {
    expect(canonicalPath('/notes/example/?from=test')).toBe('/notes/example')
    expect(absoluteUrl('/notes/example/')).toBe('https://0u0w0u0.com/notes/example')
    expect(resolvePageMeta({ title: '笔记' }, '/notes/').canonical).toBe(
      'https://0u0w0u0.com/notes'
    )
  })

  it('uses default social image dimensions and accepts exact asset dimensions', () => {
    const defaults = resolvePageMeta({}, '/')
    expect([defaults.imageWidth, defaults.imageHeight]).toEqual([1200, 630])

    const project = resolvePageMeta(
      { image: '/static/assets/project-hermes.jpg', imageWidth: 1024, imageHeight: 768 },
      '/projects/hermes'
    )
    expect(project.image).toBe('https://0u0w0u0.com/static/assets/project-hermes.jpg')
    expect([project.imageWidth, project.imageHeight]).toEqual([1024, 768])
  })

  it('generates a sitemap without draft URLs', () => {
    const sitemap = buildSitemap([note(), note(true)], [], [])

    expect(sitemap).toContain('https://0u0w0u0.com/notes/published-note')
    expect(sitemap).not.toContain('draft-note')
    expect(sitemap).toContain('<lastmod>2026-09-03</lastmod>')
  })

  it('generates escaped RSS items with absolute links and no drafts', () => {
    const rss = buildRss([note(), note(true)])

    expect(rss).toContain('<title>A &amp; B</title>')
    expect(rss).toContain('https://0u0w0u0.com/notes/published-note')
    expect(rss).not.toContain('draft-note')
    expect(rss).toContain('<pubDate>Tue, 01 Sep 2026 00:00:00 GMT</pubDate>')
  })

  it('publishes an unrestricted robots policy with the sitemap location', () => {
    expect(buildRobots()).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://0u0w0u0.com/sitemap.xml\n'
    )
  })
})
