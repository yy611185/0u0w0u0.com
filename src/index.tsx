import { Hono } from 'hono'
import { raw } from 'hono/html'
import { renderer } from './renderer'
import { Footer, MobileDrawer, Nav, SearchModal } from './components/layout'
import { AllProjects, Explore, Hero, Lab, Photos } from './components/sections'
import { SEARCH_INDEX, SITE } from './data'

const app = new Hono()

app.use(renderer)

// Lightweight API: search index (also embedded inline for zero-latency first render)
app.get('/api/search-index', (c) => c.json(SEARCH_INDEX))

app.get('/', (c) => {
  const bootstrap = JSON.stringify({ social: SITE.social, index: SEARCH_INDEX }).replace(/</g, '\\u003c')
  return c.render(
    <>
      <a href="#main" class="skip-link">跳转到主内容</a>

      <Nav />
      <MobileDrawer />

      <main id="main">
        <Hero />
        <Explore />
        <Lab />
        <Photos />
        <AllProjects />
      </main>

      <Footer />
      <SearchModal />

      <script id="site-data" type="application/json">{raw(bootstrap)}</script>
      <script src="/static/app.js" defer></script>
    </>
  )
})

export default app
