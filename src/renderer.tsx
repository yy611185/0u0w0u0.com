import { jsxRenderer } from 'hono/jsx-renderer'
import { raw } from 'hono/html'
import { SITE } from './data'

/**
 * Sets `html.js` before the first paint.
 *
 * Every entrance animation is scoped to `html.js`, so:
 *  · with JS  → elements start hidden and animate in (no flash of final state)
 *  · without JS → the class is never added and the page renders fully visible
 *
 * It must run inline in <head>, ahead of the stylesheet, otherwise the
 * un-animated layout would paint for one frame first.
 */
const JS_FLAG = `document.documentElement.classList.add('js')`

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <title>{SITE.title}</title>

        <script>{raw(JS_FLAG)}</script>

        <meta name="description" content={SITE.description} />
        <meta name="theme-color" content="#0b0f1e" />
        <meta name="color-scheme" content="dark" />
        <meta name="author" content="Yang" />

        <meta property="og:title" content={SITE.title} />
        <meta property="og:description" content="记录成长，探索可能。" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE.url} />
        <meta property="og:image" content={`${SITE.url}static/assets/og-image.jpg`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="OuOwOuO — 深夜书桌与窗外的城市灯火" />
        <meta property="og:locale" content="zh_CN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE.title} />
        <meta name="twitter:description" content="记录成长，探索可能。" />
        <meta name="twitter:image" content={`${SITE.url}static/assets/og-image.jpg`} />

        <link rel="canonical" href={SITE.url} />
        <link rel="icon" href="/static/favicon.svg" type="image/svg+xml" />

        {/* Stylesheet first: it is the only render-blocking resource that
            actually gates the first paint. */}
        <link href="/static/style.css" rel="stylesheet" />

        {/* The hero backdrop IS the first paint — fetch it at high priority. */}
        <link rel="preload" as="image" href="/static/assets/webp/hero-scene.webp" type="image/webp" fetchpriority="high" />

        {/* Fonts are swapped in, so text is readable immediately in the
            fallback face and never invisible while Google Fonts loads.
            Only the weights the stylesheet actually uses are requested
            (500/600/700 sans + 700 hand). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Noto+Sans+SC:wght@400;500;600;700&family=Manrope:wght@500;600;700&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Noto+Sans+SC:wght@400;500;600;700&family=Manrope:wght@500;600;700&display=swap"
          rel="stylesheet"
        />

      </head>
      <body>{children}</body>
    </html>
  )
})
