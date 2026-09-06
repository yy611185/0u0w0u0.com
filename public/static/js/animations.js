/**
 * animations.js — entrance choreography and ambient motion.
 *
 * Design rules enforced here:
 *  1. Nothing animates layout properties — only opacity/transform.
 *  2. Content is never gated behind an animation: the page is interactive
 *     immediately and every entrance has a fail-safe that forces the final
 *     state (so a refresh can never leave anything stuck at opacity: 0).
 *  3. Reveals fire once, near the viewport, via IntersectionObserver.
 */
import { $, $$, prefersReducedMotion, rafThrottle } from './core.js'

/* Load-sequence order. Each step is +90ms after the previous, so the whole
   hero has landed in ~1.0s while the first element appears almost at once. */
const LOAD_STEPS = [
  ['#site-nav .nav-inner', 0],
  ['.hero-title', 90],
  ['.hero-subtitle', 180],
  ['.hero-tags', 260],
  ['.hero-actions', 340],
  ['.scroll-hint', 480]
]

const STAGGER = 70 // ms between siblings inside one revealed group
const MAX_STAGGER_STEPS = 6 // cap so a long grid never crawls in

/**
 * Mark the entrance targets and hand them their delays. Delays are applied
 * through the CSSOM instead of SSR style attributes so the strict CSP can keep
 * `style-src 'self'` without `unsafe-inline`.
 */
function primeLoadSequence() {
  LOAD_STEPS.forEach(([selector, delay]) => {
    const el = $(selector)
    if (!el) return
    el.setAttribute('data-load', el.classList.contains('hero-visual') ? 'scale' : '')
    el.style.setProperty('--load-delay', `${delay}ms`)
  })

  $$('[data-load]').forEach((el) => {
    if (!el.style.getPropertyValue('--load-delay')) el.style.setProperty('--load-delay', '100ms')
  })
}

/** Groups whose children reveal as a staggered set. */
const REVEAL_GROUPS = [
  '.section-head',
  '.grid-3 > .card',
  '.bottom-row > .card',
  '.lab-grid > .lab-card',
  '.photo-grid > .photo',
  '.ap-grid > .ap-card',
  '.project-index > .project-index-card',
  '.footer-grid > *',
  '.footer-bottom'
]

/** Tag everything that should reveal on scroll, with per-item delays. */
function primeReveals() {
  REVEAL_GROUPS.forEach((selector) => {
    const items = $$(selector)
    const seen = new Map()
    items.forEach((el) => {
      const parent = el.parentElement
      const i = seen.get(parent) ?? 0
      seen.set(parent, i + 1)
      el.setAttribute('data-reveal', '')
      el.style.setProperty('--reveal-delay', `${Math.min(i, MAX_STAGGER_STEPS) * STAGGER}ms`)
    })
  })
}

/** Force every entrance to its resting state (reduced motion / no IO). */
function settleAll() {
  $$('[data-load], [data-reveal]').forEach((el) => {
    el.classList.add('is-visible', 'is-done')
    el.style.opacity = '1'
    el.style.transform = 'none'
    el.style.animation = 'none'
  })
}

function initScrollReveal() {
  const targets = $$('[data-reveal]')
  if (!targets.length) return

  if (!('IntersectionObserver' in window)) {
    settleAll()
    return
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const el = entry.target
        el.classList.add('is-visible')
        io.unobserve(el)
      })
    },
    {
      rootMargin: '0px 0px -48px 0px',
      threshold: 0
    }
  )

  targets.forEach((el) => io.observe(el))

  let sweeps = 0
  const sweep = () => {
    const pending = $$('[data-reveal]:not(.is-visible)')
    pending.forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight && r.bottom > -1) {
        el.classList.add('is-visible')
        io.unobserve(el)
      }
    })
    sweeps += 1
    if (pending.length && sweeps < 4) window.setTimeout(sweep, 1200)
  }
  window.setTimeout(sweep, 1200)
}

/** Release will-change once an entrance animation has finished. */
function initAnimationCleanup() {
  document.addEventListener(
    'animationend',
    (event) => {
      if (event.animationName === 'reveal-in') event.target.classList.add('is-done')
    },
    true
  )
}

/**
 * Hero micro-parallax: the background drifts up to 10px against the scroll
 * and the text fades slightly as it leaves. Purely compositor work, and the
 * scroll listener is rAF-throttled + passive.
 *
 * On narrow phones the 16:9 hero artwork needs different framing: `cover`
 * crops too aggressively in portrait. Keep the image slightly smaller, shift
 * the focal point toward the cat/window, and leave the photographic layer
 * anchored instead of letting desktop parallax overwrite that framing.
 */
function initHeroParallax() {
  const hero = $('.hero')
  const heroText = $('.hero-text')
  const hint = $('.scroll-hint')
  if (!hero) return undefined

  const MAX_SHIFT = 10
  const mobileHero = window.matchMedia('(max-width: 640px)')

  const update = () => {
    const y = window.scrollY
    const h = hero.offsetHeight || 1
    const progress = Math.min(1, Math.max(0, y / h))

    if (mobileHero.matches) {
      hero.style.backgroundPosition = 'center, 70% top'
      hero.style.backgroundSize = 'auto, auto 86%'
    } else {
      hero.style.backgroundSize = ''
      hero.style.backgroundPosition = `center calc(50% + ${(progress * MAX_SHIFT).toFixed(2)}px)`
    }

    if (heroText) {
      heroText.style.transform = `translate3d(0, ${(progress * MAX_SHIFT * 1.6).toFixed(2)}px, 0)`
      heroText.style.opacity = String(Math.max(0, 1 - progress * 1.15))
    }
    if (hint) hint.setAttribute('data-hidden', y > 80 ? 'true' : 'false')
  }

  const onScroll = rafThrottle(update)
  window.addEventListener('scroll', onScroll, { passive: true })
  update()

  return () => {
    window.removeEventListener('scroll', onScroll)
    hero.style.backgroundPosition = ''
    hero.style.backgroundSize = ''
    if (heroText) {
      heroText.style.transform = ''
      heroText.style.opacity = ''
    }
    if (hint) hint.removeAttribute('data-hidden')
  }
}

export function initAnimations() {
  primeLoadSequence()
  primeReveals()
  initAnimationCleanup()

  if (prefersReducedMotion()) {
    settleAll()
    return () => {}
  }

  initScrollReveal()
  const cleanupParallax = initHeroParallax()
  return () => cleanupParallax?.()
}

export { settleAll }
