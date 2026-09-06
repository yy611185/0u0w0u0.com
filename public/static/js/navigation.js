/**
 * navigation.js — nav shell behaviour.
 *  · scrolled state on the nav capsule
 *  · mobile drawer (focus trap, inert background, ESC, breakpoint reset)
 *  · same-page anchor scrolling that respects the fixed nav and reduced motion
 */
import {
  $,
  $$,
  activateOverlay,
  isTopOverlay,
  lockScroll,
  unlockScroll,
  rafThrottle,
  scrollToTarget,
  trapFocus
} from './core.js'

/** Deepen the nav glass once the page has moved off the top. */
function initScrolledState() {
  const nav = $('#site-nav')
  if (!nav) return
  const update = () => {
    nav.setAttribute('data-scrolled', window.scrollY > 24 ? 'true' : 'false')
  }
  window.addEventListener('scroll', rafThrottle(update), { passive: true })
  update()
}

function initDrawer() {
  const toggle = $('[data-menu-toggle]')
  const menu = $('#mobile-menu')
  const backdrop = $('[data-menu-backdrop]')
  if (!toggle || !menu || !backdrop) return

  $$('li', menu).forEach((li, i) => li.style.setProperty('--i', String(i)))

  let releaseTrap = null
  let releaseOverlay = null
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true'

  function setOpen(state) {
    if (state === isOpen()) return

    toggle.setAttribute('aria-expanded', state ? 'true' : 'false')
    toggle.setAttribute('aria-label', state ? '关闭菜单' : '打开菜单')
    menu.setAttribute('data-open', state ? 'true' : 'false')
    menu.setAttribute('aria-modal', state ? 'true' : 'false')
    menu.setAttribute('aria-hidden', state ? 'false' : 'true')
    backdrop.setAttribute('data-open', state ? 'true' : 'false')

    if (state) {
      menu.removeAttribute('inert')
      backdrop.removeAttribute('inert')
      lockScroll()
      releaseOverlay = activateOverlay(menu, backdrop, $('#site-nav'))
      releaseTrap = trapFocus(menu)
      const first = $('a', menu)
      if (first) requestAnimationFrame(() => first.focus())
    } else {
      menu.setAttribute('inert', '')
      backdrop.setAttribute('inert', '')
      if (releaseOverlay) {
        releaseOverlay()
        releaseOverlay = null
      }
      unlockScroll()
      if (releaseTrap) {
        releaseTrap()
        releaseTrap = null
      }
    }
  }

  toggle.addEventListener('click', () => setOpen(!isOpen()))
  backdrop.addEventListener('click', () => setOpen(false))
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setOpen(false)))

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen() && isTopOverlay(menu)) {
      event.preventDefault()
      event.stopImmediatePropagation()
      setOpen(false)
      toggle.focus()
    }
  })

  const mq = window.matchMedia('(min-width: 1025px)')
  const onChange = () => {
    if (mq.matches) setOpen(false)
  }
  if (mq.addEventListener) mq.addEventListener('change', onChange)
  else mq.addListener(onChange)
}

/**
 * Smooth same-document anchor scrolling. Links such as /#contact work on the
 * homepage, while the same link from another page is left to normal browser
 * navigation so it can first return to the homepage.
 */
function initAnchors() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href*="#"]')
    if (!link) return

    const href = link.getAttribute('href')
    if (!href) return

    const url = new URL(href, location.href)
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return

    let id
    try {
      id = decodeURIComponent(url.hash.slice(1))
    } catch {
      return
    }
    const target = document.getElementById(id)
    if (!target) return

    event.preventDefault()
    scrollToTarget(target)
    history.replaceState(null, '', `${location.pathname}${location.search}${url.hash}`)

    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1')
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })
    }
    target.focus({ preventScroll: true })
  })

  if (location.hash.length > 1) {
    let id
    try {
      id = decodeURIComponent(location.hash.slice(1))
    } catch {
      return
    }
    const target = document.getElementById(id)
    if (target) requestAnimationFrame(() => scrollToTarget(target))
  }
}

export function initNavigation() {
  initScrolledState()
  initDrawer()
  initAnchors()
}
