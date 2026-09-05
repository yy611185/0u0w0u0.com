/**
 * core.js — shared primitives for every behaviour module.
 * No DOM side effects on import; everything here is a pure helper.
 */

/** Server-injected bootstrap payload (social links + search index). */
export const DATA = (() => {
  try {
    const el = document.getElementById('site-data')
    return el ? JSON.parse(el.textContent || '{}') : {}
  } catch {
    return {}
  }
})()

const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

/** True when the visitor has asked the OS for less motion. */
export const prefersReducedMotion = () => reduceQuery.matches

/** Re-run `fn` whenever the reduced-motion preference flips. */
export function onReducedMotionChange(fn) {
  if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', fn)
  else reduceQuery.addListener(fn)
}

/** True on devices with a real hovering pointer (excludes touch). */
export const hasFinePointer = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches

export const $ = (sel, root = document) => root.querySelector(sel)
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))

/**
 * Coalesce bursty events (scroll / pointermove) into one callback per frame.
 * Returns a function that is safe to attach directly to a listener.
 */
export function rafThrottle(fn) {
  let queued = false
  let lastArgs
  return (...args) => {
    lastArgs = args
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      fn(...lastArgs)
    })
  }
}

/* ---------------------------------------------------------------
   Scroll locking
   Multiple overlays (drawer, search, lightbox) can request a lock;
   the scrollbar is only released when the last one lets go. Uses a
   counter instead of a boolean so overlays can't unlock each other.
   --------------------------------------------------------------- */
let lockCount = 0

export function lockScroll() {
  lockCount += 1
  if (lockCount === 1) document.documentElement.style.overflow = 'hidden'
}

export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) document.documentElement.style.overflow = ''
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

/**
 * Keep Tab focus inside `container` while an overlay is open.
 * Returns a teardown function.
 */
export function trapFocus(container) {
  const onKeydown = e => {
    if (e.key !== 'Tab') return
    const items = $$(FOCUSABLE, container).filter(
      el => el.offsetParent !== null || el === document.activeElement
    )
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
  container.addEventListener('keydown', onKeydown)
  return () => container.removeEventListener('keydown', onKeydown)
}

/* ---------------------------------------------------------------
   Overlay stacking and background inertness
   The newest open overlay owns the accessible surface. Closing a
   nested or underlying overlay recomputes inertness from the remaining
   stack instead of exposing the page behind another open dialog.
   --------------------------------------------------------------- */
const overlayLayers = []

function syncBackgroundInert() {
  const top = overlayLayers[overlayLayers.length - 1]
  Array.from(document.body.children).forEach(el => {
    if (el.tagName === 'SCRIPT') return
    if (top && top.allowed.includes(el)) {
      el.removeAttribute('inert')
    } else if (top || el.getAttribute('aria-hidden') === 'true') {
      el.setAttribute('inert', '')
    } else {
      el.removeAttribute('inert')
    }
  })
}

export function activateOverlay(container, ...alsoAllowed) {
  const layer = {
    container,
    allowed: [container, ...alsoAllowed].filter(Boolean)
  }
  overlayLayers.push(layer)
  syncBackgroundInert()

  let active = true
  return () => {
    if (!active) return
    active = false
    const index = overlayLayers.indexOf(layer)
    if (index >= 0) overlayLayers.splice(index, 1)
    syncBackgroundInert()
  }
}

export function isTopOverlay(container) {
  return overlayLayers[overlayLayers.length - 1]?.container === container
}

/** Scroll to a hash target, honouring the fixed nav offset & motion pref. */
export function scrollToTarget(target) {
  if (!target) return
  const navH =
    parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 88
  const top = target.getBoundingClientRect().top + window.scrollY - navH - 22
  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReducedMotion() ? 'auto' : 'smooth'
  })
}
