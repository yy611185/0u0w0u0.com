/**
 * navigation.js — nav shell behaviour.
 *  · scrolled state on the nav capsule
 *  · active-section tracking for nav links
 *  · mobile drawer (focus trap, inert background, ESC, breakpoint reset)
 *  · anchor scrolling that respects the fixed nav and reduced motion
 */
import {
  $,
  $$,
  lockScroll,
  unlockScroll,
  rafThrottle,
  scrollToTarget,
  setBackgroundInert,
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

/**
 * Highlight the nav link whose section is currently in view.
 * IntersectionObserver on the targets is cheaper and steadier than
 * recomputing offsets on every scroll event.
 */
function initActiveLink() {
  const links = $$('.nav-links a[href^="#"], .mobile-menu a[href^="#"]')
  if (!links.length || !('IntersectionObserver' in window)) return

  // Map each anchor target to all links that point at it.
  const byTarget = new Map()
  links.forEach(link => {
    const id = link.getAttribute('href').slice(1)
    if (!id) return
    const target = document.getElementById(id)
    if (!target) return
    if (!byTarget.has(target)) byTarget.set(target, [])
    byTarget.get(target).push(link)
  })
  if (!byTarget.size) return

  const visible = new Set()

  const apply = () => {
    // When several targets are on screen, the topmost one wins.
    let best = null
    let bestTop = Infinity
    visible.forEach(t => {
      const top = t.getBoundingClientRect().top
      if (top < bestTop) {
        bestTop = top
        best = t
      }
    })
    links.forEach(l => l.removeAttribute('aria-current'))
    if (best) byTarget.get(best).forEach(l => l.setAttribute('aria-current', 'true'))
  }

  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) visible.add(e.target)
        else visible.delete(e.target)
      })
      apply()
    },
    // A band across the middle of the viewport: a section counts as "current"
    // while it occupies the reading area, not merely when it peeks in.
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  )

  byTarget.forEach((_, target) => io.observe(target))
}

function initDrawer() {
  const toggle = $('[data-menu-toggle]')
  const menu = $('#mobile-menu')
  const backdrop = $('[data-menu-backdrop]')
  if (!toggle || !menu || !backdrop) return

  // Stagger index for the item cascade.
  $$('li', menu).forEach((li, i) => li.style.setProperty('--i', String(i)))

  let releaseTrap = null
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true'

  function setOpen(state) {
    if (state === isOpen()) return

    toggle.setAttribute('aria-expanded', state ? 'true' : 'false')
    toggle.setAttribute('aria-label', state ? '关闭菜单' : '打开菜单')
    menu.setAttribute('data-open', state ? 'true' : 'false')
    menu.setAttribute('aria-modal', state ? 'true' : 'false')
    backdrop.setAttribute('data-open', state ? 'true' : 'false')

    if (state) {
      lockScroll()
      setBackgroundInert(true, menu, backdrop, $('#site-nav'))
      releaseTrap = trapFocus(menu)
      const first = $('a', menu)
      if (first) requestAnimationFrame(() => first.focus())
    } else {
      unlockScroll()
      setBackgroundInert(false)
      if (releaseTrap) {
        releaseTrap()
        releaseTrap = null
      }
    }
  }

  toggle.addEventListener('click', () => setOpen(!isOpen()))
  backdrop.addEventListener('click', () => setOpen(false))

  // Close on navigation — the anchor scroll is handled by initAnchors.
  $$('a', menu).forEach(a => a.addEventListener('click', () => setOpen(false)))

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) {
      e.preventDefault()
      setOpen(false)
      toggle.focus()
    }
  })

  // Rotating a tablet into desktop width hides the hamburger; make sure the
  // drawer doesn't stay open (and scroll-locked) behind an invisible toggle.
  const mq = window.matchMedia('(min-width: 1025px)')
  const onChange = () => {
    if (mq.matches) setOpen(false)
  }
  if (mq.addEventListener) mq.addEventListener('change', onChange)
  else mq.addListener(onChange)
}

/**
 * Smooth anchor scrolling.
 * Handled in JS (rather than relying on CSS scroll-behavior alone) so we can
 * apply the nav offset, move focus for keyboard users, and keep the URL clean.
 */
function initAnchors() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]')
    if (!link) return

    const href = link.getAttribute('href')
    if (!href || href === '#') {
      // Brand link → back to top.
      if (link.classList.contains('nav-brand')) {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: 'smooth' })
        history.replaceState(null, '', location.pathname)
      }
      return
    }

    const target = document.getElementById(href.slice(1))
    if (!target) return // Unknown anchor: let the browser deal with it.

    e.preventDefault()
    scrollToTarget(target)
    history.replaceState(null, '', href)

    // Keep keyboard focus with the visual position without adding a
    // permanent tabstop to the document.
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1')
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })
    }
    target.focus({ preventScroll: true })
  })

  // A hash in the URL on first load would land under the fixed nav.
  if (location.hash.length > 1) {
    const target = document.getElementById(location.hash.slice(1))
    if (target) requestAnimationFrame(() => scrollToTarget(target))
  }
}

export function initNavigation() {
  initScrolledState()
  initActiveLink()
  initDrawer()
  initAnchors()
}
