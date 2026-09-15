import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    cloudflare({
      persistState: process.env.FITNESS_E2E === '1' ? { path: '.wrangler/fitness-e2e' } : true
    })
  ],
  build: {
    sourcemap: true
  }
})
