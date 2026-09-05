/**
 * search.js — ⌘/Ctrl+K command palette.
 * Rebuilt on top of core's scroll-lock/focus-trap helpers, with proper
 * combobox/listbox semantics and DOM-built rows (no innerHTML injection).
 */
import {
  $,
  $$,
  activateOverlay,
  DATA,
  isTopOverlay,
  lockScroll,
  unlockScroll,
  scrollToTarget,
  trapFocus
} from './core.js'

const KIND_LABEL = { project: '项目', note: '笔记', lab: '实验', page: '页面' }
const ORDER = ['project', 'note', 'lab', 'page']

export function initSearch() {
  const modal = $('#search-modal')
  const input = $('#search-input')
  const results = $('#search-results')
  const openBtn = $('[data-search-open]')
  if (!modal || !input || !results || !openBtn) return

  const INDEX = Array.isArray(DATA.index) ? DATA.index : []
  let rows = [] // flat list of { el, href } in render order
  let focusIdx = 0
  let releaseTrap = null
  let releaseOverlay = null
  let lastFocused = null

  const isOpen = () => modal.getAttribute('data-open') === 'true'

  function matches(query, item) {
    if (!query) return true
    const haystack = `${item.title} ${item.desc} ${KIND_LABEL[item.kind] || ''}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  }

  function buildRow(item, index) {
    const row = document.createElement('div')
    row.className = 'search-item'
    row.setAttribute('role', 'option')
    row.id = `search-opt-${index}`
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

  function render(query) {
    const list = INDEX.filter(i => matches(query, i))
    results.textContent = ''
    rows = []
    focusIdx = 0

    if (!list.length) {
      const empty = document.createElement('div')
      empty.className = 'search-empty'
      empty.textContent = '没有匹配的结果 — 试试 "项目" 或 "笔记"'
      results.append(empty)
      input.removeAttribute('aria-activedescendant')
      return
    }

    const groups = new Map()
    list.forEach(i => {
      if (!groups.has(i.kind)) groups.set(i.kind, [])
      groups.get(i.kind).push(i)
    })

    const frag = document.createDocumentFragment()
    ORDER.forEach(kind => {
      const items = groups.get(kind)
      if (!items) return
      const heading = document.createElement('div')
      heading.className = 'search-group'
      heading.setAttribute('role', 'presentation')
      heading.textContent = KIND_LABEL[kind]
      frag.append(heading)
      items.forEach(item => {
        const row = buildRow(item, rows.length)
        rows.push({ el: row, href: item.href })
        frag.append(row)
      })
    })
    results.append(frag)
    updateFocus()
  }

  function updateFocus() {
    rows.forEach((r, i) => {
      const active = i === focusIdx
      r.el.setAttribute('data-focus', active ? 'true' : 'false')
      r.el.setAttribute('aria-selected', active ? 'true' : 'false')
    })
    const current = rows[focusIdx]
    if (current) {
      current.el.scrollIntoView({ block: 'nearest' })
      // Announce the highlighted row without moving real focus off the input.
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
      render('')
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
      // Return focus where the user left it.
      if (lastFocused && document.contains(lastFocused) && !lastFocused.closest('[inert]')) lastFocused.focus()
      else openBtn.focus()
    }
  }

  function activate(index) {
    const row = rows[index]
    if (!row) return
    const href = row.href
    setOpen(false)
    const target = document.getElementById(href.replace(/^#/, ''))
    if (target) {
      history.replaceState(null, '', href)
      // Wait a frame for the scroll lock to lift before scrolling.
      requestAnimationFrame(() => {
        scrollToTarget(target)
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1')
          target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })
        }
        target.focus({ preventScroll: true })
      })
    } else {
      location.hash = href
    }
  }

  openBtn.addEventListener('click', () => setOpen(true))
  $$('[data-search-close]').forEach(el => el.addEventListener('click', () => setOpen(false)))
  input.addEventListener('input', e => render(e.target.value))

  results.addEventListener('click', e => {
    const row = e.target.closest('.search-item')
    if (!row) return
    activate(rows.findIndex(r => r.el === row))
  })
  // Hovering a row moves the keyboard cursor with it — no double highlight.
  results.addEventListener('pointermove', e => {
    const row = e.target.closest('.search-item')
    if (!row) return
    const i = rows.findIndex(r => r.el === row)
    if (i >= 0 && i !== focusIdx) {
      focusIdx = i
      updateFocus()
    }
  })

  document.addEventListener('keydown', e => {
    // ⌘K / Ctrl+K toggles from anywhere.
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      setOpen(!isOpen())
      return
    }
    if (e.key === '/' && !isOpen() && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (!isOpen() || !isTopOverlay(modal)) return

    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopImmediatePropagation()
      setOpen(false)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!rows.length) return
      const dir = e.key === 'ArrowDown' ? 1 : -1
      focusIdx = (focusIdx + dir + rows.length) % rows.length
      updateFocus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusIdx = 0
      updateFocus()
    } else if (e.key === 'End') {
      e.preventDefault()
      focusIdx = Math.max(0, rows.length - 1)
      updateFocus()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      activate(focusIdx)
    }
  })
}
