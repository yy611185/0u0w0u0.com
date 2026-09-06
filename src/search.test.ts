import { describe, expect, it } from 'vitest'
import { parseNote } from './content'
import { createSearchIndex } from './search'

describe('search index', () => {
  it('creates absolute-path entries from content and includes core pages', () => {
    const note = parseNote(
      `---
title: 可搜索笔记
slug: searchable-note
date: 2026-09-01
updated: 2026-09-01
description: 搜索说明
tags:
  - 索引
draft: false
---
正文`,
      'search.md'
    )
    const index = createSearchIndex([], [note], [])

    expect(index).toContainEqual(
      expect.objectContaining({ title: '可搜索笔记', href: '/notes/searchable-note' })
    )
    expect(index).toContainEqual(expect.objectContaining({ title: '首页', href: '/' }))
  })
})
