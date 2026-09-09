/**
 * search.js — ⌘/Ctrl+K command palette.
 * Loads the search index only when search is first opened, then keeps it in
 * memory for the rest of the page lifetime.
 */
import {
  $,
  $$,
  activateOverlay,
  isTopOverlay,
  lockScroll,
  unlockScroll,
  scrollToTarget,
  trapFocus
} from './core.js'

const KIND_LABEL = { project: '项目', note: '笔记', lab: '实验', page: '页面' }
const ORDER = ['project', 'note', 'lab', 'page']
const DEFAULT_LIMITS = { project: 3, note: 3, lab: 2, page: 4 }
const QUERY_LIMIT = 30

export function initSearch() {
  const modal = $('#search-modal')
  const input = $('#search-input')
  const results = $('#search-results')
  const openBtns = $$('[data-search-open]')
  const openBtn = openBtns[0]
  if (!modal || !input || !results || !openBtn) return

  let index = null
  let indexPromise = null
  let rows = [] // flat list of { el, href } in render order
  let focusIdx = 0
  let releaseTrap = null
  let releaseOverlay = null
  let lastFocused = null

  const isOpen = () => modal.getAttribute('data-open') === 'true'

  function loadIndex() {
    if (index) return Promise.resolve(index)
    if (indexPromise) return indexPromise

    indexPromise = fetch('/api/search-index', {
      headers: { Accept: 'application/json' }
    })
      .then((response) => {
        if (!response.ok) throw new Error(`search index request failed: ${response.status}`)
        return response.json()
      })
      .then((data) => {
        index = Array.isArray(data) ? data : []
        return index
      })
      .catch((error) => {
        indexPromise = null
        throw error
      })

    return indexPromise
  }

  function matches(query, item) {
    if (!query) return true
    const haystack =
      `${item.title} ${item.desc} ${(item.tags || []).join(' ')} ${KIND_LABEL[item.kind] || ''}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  }

  function defaultResults(items) {
    return ORDER.flatMap((kind) =>
      items.filter((item) => item.kind === kind).slice(0, DEFAULT_LIMITS[kind] ?? 0)
    )
  }

  function buildRow(item, rowIndex) {
    const row = document.createElement('div')
    row.className = 'search-item'
    row.setAttribute('role', 'option')
    row.id = `search-opt-${rowIndex}`
    row.setAttribute('aria-selected', 'false')
    row.dataset.href = item.href

    const icon = document.createElement('div')
    icon.className = 'search-item-icon'
    icon.setAttribute('aria-hidden', 'true')
    icon.textContent = item.icon

    const body = document.createElement('div')
    const title = document.createElement('div')
    title.className = 'search-item-title'
    title.textContent = item.title
    const desc = document.createElement('div')
    desc.className = 'search-item-desc'
    desc.textContent = item.desc
    body.append(title, desc)

    const kind = document.createElement('span')
    kind.className = 'search-item-kind'
    kind.textContent = KIND_LABEL[item.kind] || item.kind

    row.append(icon, body, kind)
    return row
  }

  function renderMessage(message) {
    results.textContent = ''
    rows = []
    focusIdx = 0
    input.removeAttribute('aria-activedescendant')
    const state = document.createElement('div')
    state.className = 'search-empty'
    state.textContent = message
    results.append(state)
  }

  function render(query) {
    const normalizedQuery = query.trim()
    const list = normalizedQuery
      ? (index || []).filter((item) => matches(normalizedQuery, item)).slice(0, QUERY_LIMIT)
      : defaultResults(index || [])
    results.textContent = ''
    rows = []
    focusIdx = 0

    if (!list.length) {
      renderMessage('没有匹配的结果 — 试试 "项目" 或 "笔记"')
      return
    }

    const groups = new Map()
    list.forEach((item) => {
      if (!groups.has(item.kind)) groups.set(item.kind, [])
      groups.get(item.kind).push(item)
    })

    const frag = document.createDocumentFragment()
    ORDER.forEach((kind) => {
      const items = groups.get(kind)
      if (!items) return
      const heading = document.createElement('div')
      heading.className = 'search-group'
      heading.setAttribute('role', 'presentation')
      heading.textContent = KIND_LABEL[kind]
      frag.append(heading)
      items.forEach((item) => {
        const row = buildRow(item, rows.length)
        rows.push({ el: row, href: item.href })
        frag.append(row)
      })
    })
    results.append(frag)
    updateFocus()
  }

  function updateFocus() {
    rows.forEach((row, i) => {
      const active = i === focusIdx
      row.el.setAttribute('data-focus', active ? 'true' : 'false')
      row.el.setAttribute('aria-selected', active ? 'true' : 'false')
    })
    const current = rows[focusIdx]
    if (current) {
      current.el.scrollIntoView({ block: 'nearest' })
      input.setAttribute('aria-activedescendant', current.el.id)
    } else {
      input.removeAttribute('aria-activedescendant')
    }
  }

  function setOpen(state) {
    if (state === isOpen()) return
    modal.setAttribute('data-open', state ? 'true' : 'false')

    if (state) {
      lastFocused = document.activeElement
      modal.setAttribute('aria-hidden', 'false')
      modal.removeAttribute('inert')
      input.setAttribute('aria-expanded', 'true')
      lockScroll()
      releaseOverlay = activateOverlay(modal)
      releaseTrap = trapFocus(modal)
      input.value = ''

      if (index) {
        render('')
      } else {
        renderMessage('正在加载搜索索引…')
        loadIndex()
          .then(() => {
            if (isOpen()) render(input.value)
          })
          .catch(() => {
            if (isOpen()) renderMessage('搜索暂时不可用，请稍后再试。')
          })
      }

      requestAnimationFrame(() => input.focus())
    } else {
      modal.setAttribute('aria-hidden', 'true')
      modal.setAttribute('inert', '')
      input.setAttribute('aria-expanded', 'false')
      if (releaseOverlay) {
        releaseOverlay()
        releaseOverlay = null
      }
      unlockScroll()
      if (releaseTrap) {
        releaseTrap()
        releaseTrap = null
      }
      input.removeAttribute('aria-activedescendant')
      if (
        lastFocused instanceof HTMLElement &&
        lastFocused !== document.body &&
        lastFocused !== document.documentElement &&
        document.contains(lastFocused) &&
        !lastFocused.closest('[inert]')
      )
        lastFocused.focus()
      else openBtn.focus()
    }
  }

  function activate(rowIndex) {
    const row = rows[rowIndex]
    if (!row) return
    const href = row.href
    setOpen(false)
    const target = href.startsWith('#') ? document.getElementById(href.slice(1)) : null
    if (target) {
      history.replaceState(null, '', href)
      requestAnimationFrame(() => {
        scrollToTarget(target)
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1')
          target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })
        }
        target.focus({ preventScroll: true })
      })
    } else location.assign(href)
  }

  openBtns.forEach((button) => button.addEventListener('click', () => setOpen(true)))
  $$('[data-search-close]').forEach((el) => el.addEventListener('click', () => setOpen(false)))
  input.addEventListener('input', (event) => {
    if (index) render(event.target.value)
  })
  input.addEventListener('keydown', (event) => {
    if (event.isComposing || !isOpen() || !isTopOverlay(modal)) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!rows.length) return
      const dir = event.key === 'ArrowDown' ? 1 : -1
      focusIdx = (focusIdx + dir + rows.length) % rows.length
      updateFocus()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      activate(focusIdx)
    }
  })

  results.addEventListener('click', (event) => {
    const row = event.target.closest('.search-item')
    if (!row) return
    activate(rows.findIndex((item) => item.el === row))
  })
  results.addEventListener('pointermove', (event) => {
    const row = event.target.closest('.search-item')
    if (!row) return
    const i = rows.findIndex((item) => item.el === row)
    if (i >= 0 && i !== focusIdx) {
      focusIdx = i
      updateFocus()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.isComposing) return

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      setOpen(!isOpen())
      return
    }
    if (
      event.key === '/' &&
      !isOpen() &&
      !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)
    ) {
      event.preventDefault()
      setOpen(true)
      return
    }
    if (!isOpen() || !isTopOverlay(modal)) return

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopImmediatePropagation()
      setOpen(false)
    }
  })
}
