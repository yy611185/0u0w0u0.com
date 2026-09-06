/**
 * main.js — entry point. Wires the behaviour modules together.
 *
 * Loaded as `<script type="module">`, which is deferred by definition, so the
 * DOM is parsed by the time this runs. Each module is independent and guards
 * its own selectors, so a missing section can never break the rest.
 */
import { onReducedMotionChange } from './core.js'
import { initAnimations, settleAll } from './animations.js'
import { initNavigation } from './navigation.js'
import { initSearch } from './search.js'
import { initLightbox } from './lightbox.js'
import { initInteraction } from './interaction.js'

function boot() {
  initAnimations()
  initNavigation()
  initSearch()
  initLightbox()
  initInteraction()

  // Honour a mid-session switch to "reduce motion": show everything at rest.
  onReducedMotionChange((e) => {
    if (e.matches) settleAll()
  })
}

boot()
