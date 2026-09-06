import { Hono } from 'hono'
import type { Child } from 'hono/jsx'
import { renderer } from './renderer'
import { SiteShell } from './components/layout'
import { AllProjects, Explore, Hero, Lab, Photos } from './components/sections'
import {
  AboutPage,
  ErrorPage,
  JsonLd,
  LabDetail,
  LabIndex,
  NoteDetail,
  NotesIndex,
  NotFoundPage,
  NowPage,
  PhotosPage,
  ProjectDetail,
  ProjectsIndex
} from './components/pages'
import {
  getAllLabItems,
  getAllNotes,
  getAllProjects,
  getLabItemBySlug,
  getNoteBySlug,
  getProjectBySlug
} from './content'
import { SEARCH_INDEX } from './search'
import { SITE } from './data'
import { absoluteUrl, buildRobots, buildRss, buildSitemap, canonicalPath } from './seo'

const app = new Hono()
app.use('*', async (c, next) => {
  const nonce = crypto.randomUUID().replaceAll('-', '')
  c.set('cspNonce', nonce)
  await next()
  const headers = c.res.headers
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      "style-src 'self'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; ')
  )
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), geolocation=(), microphone=(), payment=(), usb=()')
  if (!headers.has('Cache-Control'))
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
})
app.use('*', async (c, next) => {
  const normalized = canonicalPath(c.req.path)
  if (normalized !== c.req.path) {
    const url = new URL(c.req.url)
    url.pathname = normalized
    return c.redirect(`${url.pathname}${url.search}`, 308)
  }
  await next()
})
app.use('*', renderer)

const shell = (children: Child, lightbox = false) => (
  <SiteShell lightbox={lightbox}>{children}</SiteShell>
)

app.get('/api/search-index', (c) => {
  c.header('Cache-Control', 'public, max-age=300, must-revalidate')
  return c.json(SEARCH_INDEX)
})
app.get('/sitemap.xml', (c) =>
  c.body(buildSitemap(getAllNotes(), getAllProjects(), getAllLabItems()), 200, {
    'Content-Type': 'application/xml; charset=UTF-8',
    'Cache-Control': 'public, max-age=300, must-revalidate'
  })
)
app.get('/robots.txt', (c) =>
  c.body(buildRobots(), 200, {
    'Content-Type': 'text/plain; charset=UTF-8',
    'Cache-Control': 'public, max-age=3600, must-revalidate'
  })
)
app.get('/rss.xml', (c) =>
  c.body(buildRss(getAllNotes()), 200, {
    'Content-Type': 'application/rss+xml; charset=UTF-8',
    'Cache-Control': 'public, max-age=300, must-revalidate'
  })
)

app.get('/', (c) =>
  c.render(
    shell(
      <>
        <Hero />
        <Explore />
        <Lab />
        <Photos />
        <AllProjects />
        <JsonLd
          value={[
            {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE.name,
              url: SITE.url,
              description: SITE.description
            },
            {
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Yang',
              description: 'OuOwOuO 数字花园的作者',
              url: SITE.url,
              sameAs: SITE.social.github ? [SITE.social.github] : []
            }
          ]}
        />
      </>,
      true
    )
  )
)

app.get('/notes', (c) =>
  c.render(shell(<NotesIndex notes={getAllNotes()} />), {
    title: '笔记',
    description: 'Yang 的数字花园笔记：关于学习、创造、互联网与成长的持续记录。'
  })
)

app.get('/notes/:slug', (c) => {
  const note = getNoteBySlug(c.req.param('slug'))
  if (!note) return c.notFound()
  const notes = getAllNotes()
  const index = notes.findIndex((item) => item.slug === note.slug)
  return c.render(
    shell(
      <>
        <NoteDetail note={note} previous={notes[index + 1]} next={notes[index - 1]} />
        <JsonLd
          value={{
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: note.title,
            description: note.description,
            url: absoluteUrl(`/notes/${note.slug}`),
            datePublished: note.date,
            dateModified: note.updated,
            author: { '@type': 'Person', name: 'Yang', url: SITE.url },
            mainEntityOfPage: absoluteUrl(`/notes/${note.slug}`)
          }}
        />
      </>
    ),
    {
      title: note.title,
      description: note.description,
      canonical: `/notes/${note.slug}`,
      type: 'article'
    }
  )
})

app.get('/projects', (c) =>
  c.render(shell(<ProjectsIndex projects={getAllProjects()} />), {
    title: '项目',
    description: 'Yang 的项目作品：个人投资工具、健康记录产品与智能助理。'
  })
)

app.get('/projects/:slug', (c) => {
  const project = getProjectBySlug(c.req.param('slug'))
  if (!project) return c.notFound()
  const related = getAllProjects()
    .filter((item) => item.slug !== project.slug)
    .slice(0, 2)
  return c.render(
    shell(
      <>
        <ProjectDetail project={project} related={related} />
        <JsonLd
          value={{
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: project.title,
            headline: project.tagline,
            description: project.description,
            applicationCategory: 'WebApplication',
            datePublished: project.date,
            dateModified: project.updated,
            author: { '@type': 'Person', name: 'Yang', url: SITE.url },
            url: absoluteUrl(`/projects/${project.slug}`),
            image: new URL(project.cover.fallback, SITE.url).toString(),
            ...(project.repository ? { codeRepository: project.repository } : {})
          }}
        />
      </>
    ),
    {
      title: project.title,
      description: project.description,
      canonical: `/projects/${project.slug}`,
      image: project.cover.fallback
    }
  )
})

app.get('/lab', (c) =>
  c.render(shell(<LabIndex items={getAllLabItems()} />), {
    title: '实验室',
    description: 'Yang 的实验室：AI、自动化、金融与 Web 原型和探索记录。'
  })
)

app.get('/lab/:slug', (c) => {
  const item = getLabItemBySlug(c.req.param('slug'))
  if (!item) return c.notFound()
  return c.render(
    shell(
      <>
        <LabDetail item={item} />
        <JsonLd
          value={{
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: item.title,
            headline: item.title,
            description: item.description,
            url: absoluteUrl(`/lab/${item.slug}`),
            datePublished: item.date,
            dateModified: item.updated,
            author: { '@type': 'Person', name: 'Yang', url: SITE.url }
          }}
        />
      </>
    ),
    { title: item.title, description: item.description, canonical: `/lab/${item.slug}` }
  )
})

app.get('/photos', (c) =>
  c.render(shell(<PhotosPage />, true), {
    title: '照片',
    description: '城市、深夜、光线和猫：Yang 的生活照片墙。'
  })
)

app.get('/now', (c) =>
  c.render(shell(<NowPage />), {
    title: '近况',
    description: 'Yang 此刻正在阅读、学习、开发和思考的事情。'
  })
)

app.get('/about', (c) =>
  c.render(shell(<AboutPage />), {
    title: '关于',
    description: '关于 Yang，以及 OuOwOuO 这个持续生长的个人网站与数字花园。'
  })
)

app.notFound((c) => {
  c.status(404)
  return c.render(shell(<NotFoundPage />), {
    title: '404',
    description: '这里好像什么都没有。返回 OuOwOuO 数字花园继续探索。',
    canonical: c.req.path,
    robots: 'noindex, follow'
  })
})

app.onError((error, c) => {
  console.error(
    JSON.stringify({ message: 'unhandled request error', error: error.message, path: c.req.path })
  )
  c.status(500)
  return c.render(shell(<ErrorPage />), {
    title: '暂时无法打开',
    description: '服务器暂时无法完成请求，请稍后重试。',
    canonical: c.req.path,
    robots: 'noindex, nofollow'
  })
})

export default app
