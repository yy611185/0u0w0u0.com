import { jsxRenderer } from 'hono/jsx-renderer'
import { raw } from 'hono/html'
import type { Child } from 'hono/jsx'
import { SITE } from './data'
import { resolvePageMeta, type PageMeta } from './seo'

const JS_FLAG = `document.documentElement.classList.add('js')`

declare module 'hono' {
  interface ContextVariableMap {
    cspNonce: string
  }

  interface ContextRenderer {
    (content: Child, props?: PageMeta): Response | Promise<Response>
  }
}

export const renderer = jsxRenderer((props, c) => {
  const { children } = props
  const { title, description, canonical, image, type, robots } = resolvePageMeta(props, c.req.path)
  const nonce = c.get('cspNonce')

  return (
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <title>{title}</title>
        <script nonce={nonce}>{raw(JS_FLAG)}</script>
        <meta name="description" content={description} />
        <meta name="robots" content={robots} />
        <meta name="theme-color" content="#0b0f1e" />
        <meta name="color-scheme" content="dark" />
        <meta name="author" content="Yang" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content={type} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={image} />
        <meta property="og:image:alt" content={`${title} 社交分享图`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="zh_CN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <link rel="canonical" href={canonical} />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE.name} RSS`}
          href="/rss.xml"
        />
        <link rel="icon" href="/static/favicon.svg" type="image/svg+xml" />
        <link href="/static/style.css" rel="stylesheet" />
        <link
          rel="preload"
          as="font"
          href="/static/fonts/manrope-latin-700-normal.woff2"
          type="font/woff2"
          crossorigin="anonymous"
        />
        {c.req.path === '/' && (
          <link
            rel="preload"
            as="image"
            href="/static/assets/webp/hero-scene.webp"
            type="image/webp"
            fetchpriority="high"
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  )
})
