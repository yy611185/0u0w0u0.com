/**
 * lightbox.js — full-size viewer for the Photo Wall.
 * The photos are the content of that section, so being able to actually look
 * at them earns its keep. Placeholder tiles are skipped.
 *
 * Keyboard: Esc closes, ← / → step, focus is trapped and restored.
 */
import {
  $,
  $$,
  activateOverlay,
  isTopOverlay,
  lockScroll,
  unlockScroll,
  trapFocus
} from './core.js'

export function initLightbox() {
  const lightbox = $('#lightbox')
  if (!lightbox) return

  const imgEl = $('#lightbox-img', lightbox)
  const capEl = $('#lightbox-cap', lightbox)
  const countEl = $('#lightbox-count', lightbox)
  const closeBtn = $('.lb-close', lightbox)
  const prevBtn = $('.lb-prev', lightbox)
  const nextBtn = $('.lb-next', lightbox)
  if (!imgEl) return

  // Collect the real (non-placeholder) photos in DOM order.
  const photos = $$('.photo')
    .map((fig) => {
      const img = $('img', fig)
      if (!img) return null
      const cap = $('.cap', fig)
      return {
        fig,
        // currentSrc resolves the <picture> the browser actually chose,
        // so the lightbox reuses the already-cached WebP/JPEG.
        src: img.currentSrc || img.src,
        alt: img.getAttribute('alt') || '',
        cap: cap ? cap.textContent.trim() : '',
        width: Number(img.getAttribute('width')) || img.naturalWidth,
        height: Number(img.getAttribute('height')) || img.naturalHeight
      }
    })
    .filter(Boolean)

  if (!photos.length) {
    lightbox.remove()
    return
  }

  const many = photos.length > 1
  if (!many) {
    if (prevBtn) prevBtn.hidden = true
    if (nextBtn) nextBtn.hidden = true
  }

  let index = 0
  let releaseTrap = null
  let releaseOverlay = null
  let lastFocused = null

  const isOpen = () => lightbox.getAttribute('data-open') === 'true'

  function show(i) {
    index = (i + photos.length) % photos.length
    const p = photos[index]
    imgEl.src = p.src
    imgEl.alt = p.alt
    imgEl.width = p.width
    imgEl.height = p.height
    if (capEl) capEl.textContent = p.cap
    if (countEl) countEl.textContent = many ? `${index + 1} / ${photos.length}` : ''
  }

  function setOpen(state, startIndex = 0) {
    if (state === isOpen()) return
    if (state) {
      lastFocused = document.activeElement
      show(startIndex)
      lightbox.setAttribute('data-open', 'true')
      lightbox.setAttribute('aria-hidden', 'false')
      lightbox.removeAttribute('inert')
      lockScroll()
      releaseOverlay = activateOverlay(lightbox)
      releaseTrap = trapFocus(lightbox)
      requestAnimationFrame(() => (closeBtn || lightbox).focus())
    } else {
      lightbox.setAttribute('data-open', 'false')
      lightbox.setAttribute('aria-hidden', 'true')
      unlockScroll()
      lightbox.setAttribute('inert', '')
      if (releaseOverlay) {
        releaseOverlay()
        releaseOverlay = null
      }
      if (releaseTrap) {
        releaseTrap()
        releaseTrap = null
      }
      if (lastFocused && document.contains(lastFocused) && !lastFocused.closest('[inert]'))
        lastFocused.focus()
    }
  }

  // Each photo gets a real <button> overlay: keyboard reachable and announced.
  photos.forEach((p, i) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'photo-btn'
    btn.setAttribute('aria-label', `查看大图${p.cap ? `：${p.cap}` : ''}`)
    btn.addEventListener('click', () => setOpen(true, i))
    p.fig.append(btn)

    const hint = document.createElement('span')
    hint.className = 'zoom-hint'
    hint.setAttribute('aria-hidden', 'true')
    hint.innerHTML =
      '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/></svg>'
    p.fig.append(hint)
  })

  $$('[data-lightbox-close]', lightbox).forEach((el) =>
    el.addEventListener('click', () => setOpen(false))
  )
  if (prevBtn) prevBtn.addEventListener('click', () => show(index - 1))
  if (nextBtn) nextBtn.addEventListener('click', () => show(index + 1))

  document.addEventListener('keydown', (e) => {
    if (!isOpen() || !isTopOverlay(lightbox)) return
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopImmediatePropagation()
      setOpen(false)
    } else if (many && e.key === 'ArrowRight') {
      e.preventDefault()
      show(index + 1)
    } else if (many && e.key === 'ArrowLeft') {
      e.preventDefault()
      show(index - 1)
    }
  })
}
