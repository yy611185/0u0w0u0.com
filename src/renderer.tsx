import { jsxRenderer } from 'hono/jsx-renderer'
import { SITE } from './data'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <title>{SITE.title}</title>

        <meta name="description" content={SITE.description} />
        <meta name="theme-color" content="#0b0f1e" />
        <meta name="author" content="Yang" />

        <meta property="og:title" content={SITE.title} />
        <meta property="og:description" content="记录成长，探索可能。" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE.url} />
        <meta property="og:image" content="/static/assets/webp/hero-scene.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE.title} />
        <meta name="twitter:description" content="记录成长，探索可能。" />
        <meta name="twitter:image" content="/static/assets/webp/hero-scene.webp" />

        <link rel="canonical" href={SITE.url} />
        <link rel="icon" href="/static/favicon.svg" type="image/svg+xml" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Noto+Sans+SC:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Preload the shared night-cat backdrop (Lab / Photos / All Projects) */}
        <link rel="preload" as="image" href="/static/assets/webp/bg-night-cat.webp" type="image/webp" media="(min-width: 769px)" />
        <link href="/static/style.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
})
