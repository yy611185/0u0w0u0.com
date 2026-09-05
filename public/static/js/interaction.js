/**
 * interaction.js — pointer-aware micro-interactions.
 *
 * Only the Lab cards tilt, and only by ±1.5°. That is enough to feel
 * responsive without making the page feel unstable, and it is scoped to
 * fine pointers so a touch device never gets a stuck transform.
 * The tilt is written as two custom properties which CSS composes with the
 * hover lift, so JS never fights the stylesheet over `transform`.
 */
import { $$, hasFinePointer, prefersReducedMotion, rafThrottle } from './core.js'

const MAX_TILT = 1.5 // degrees

function attachTilt(card) {
  let raf = null

  const onMove = rafThrottle(e => {
    const r = card.getBoundingClientRect()
    // -0.5 … 0.5 relative to the card centre.
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    // Pointer right → rotateY positive; pointer down → rotateX negative.
    card.style.setProperty('--tilt-y', `${(px * MAX_TILT * 2).toFixed(3)}deg`)
    card.style.setProperty('--tilt-x', `${(-py * MAX_TILT * 2).toFixed(3)}deg`)
  })

  const onLeave = () => {
    if (raf) cancelAnimationFrame(raf)
    // Ease back to flat rather than snapping.
    card.style.transition = 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)'
    card.style.setProperty('--tilt-x', '0deg')
    card.style.setProperty('--tilt-y', '0deg')
    window.setTimeout(() => {
      card.style.transition = ''
    }, 400)
  }

  card.addEventListener('pointermove', onMove)
  card.addEventListener('pointerleave', onLeave)
  card.addEventListener('blur', onLeave)

  return () => {
    card.removeEventListener('pointermove', onMove)
    card.removeEventListener('pointerleave', onLeave)
    card.removeEventListener('blur', onLeave)
    card.style.removeProperty('--tilt-x')
    card.style.removeProperty('--tilt-y')
  }
}

export function initInteraction() {
  if (prefersReducedMotion() || !hasFinePointer()) return
  // Only pointer devices that actually hover get the tilt.
  $$('.lab-card').forEach(attachTilt)
}
