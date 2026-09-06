# OuOwOuO — Yang 的数字花园

OuOwOuO 是一个运行在 Cloudflare Workers 上的个人数字花园，用来持续发布项目、笔记、实验、近况与生活记录。

网站采用 Hono JSX 服务端渲染，多页面输出完整 HTML；浏览器端只加载导航、搜索、动效和照片查看器所需的 Vanilla ES Modules，不使用 SPA，也不依赖 React Hydration。

Production: <https://0u0w0u0.com/>

## 当前状态

- 已部署到 Cloudflare Workers，并使用 `0u0w0u0.com` 作为生产域名。
- `main` 是受保护的生产基线，仓库启用了 `Protect main` Ruleset。
- 所有代码变更通过 branch → Pull Request → required `verify` CI → merge 进入 `main`。
- GitHub CI 会执行 TypeScript、ESLint、Prettier、Vitest、生产构建与 Playwright Chromium 测试。
- 内容、搜索、SEO、Sitemap、RSS、404、响应式布局与可访问性交互均由同一套 SSR 应用维护。
- 当前不依赖数据库、CMS、D1、KV 或第三方前端框架。

## 技术栈

- Hono 4 + Hono JSX SSR
- TypeScript 6（strict）
- Vite 8 + Cloudflare 官方 Vite Plugin
- Cloudflare Workers + Static Assets
- MarkdownIt
- Vanilla JavaScript ES Modules
- 原生 CSS
- WebP / JPEG / PNG / SVG
- 自托管 WOFF2 字体
- Vitest
- Playwright
- ESLint + Prettier
- GitHub Actions

运行环境固定在 Node.js 24。

## 架构

```text
Visitor
  ↓
Cloudflare Edge
  ├─ Static Assets
  │   ├─ CSS / JS
  │   ├─ Images / WebP
  │   ├─ Fonts
  │   └─ Favicons
  │
  └─ Hono Worker
      ├─ SSR pages
      ├─ Content routes
      ├─ /api/search-index
      ├─ /sitemap.xml
      ├─ /robots.txt
      └─ /rss.xml
```

内容来自仓库中的 Markdown，在构建阶段读取、校验并生成页面数据。浏览器不会接收整份 Markdown 内容，也不会在客户端完成页面路由。

## 主要功能

### 多页面 SSR

首页、项目、笔记、实验室、照片、近况、关于页和详情页全部由 Hono 在 Worker 中生成完整 HTML。

### 内容系统

`content/` 中的 Markdown frontmatter 会在构建阶段校验：

- 必填字段
- URL-safe slug
- 真实日期
- `updated >= date`
- 枚举状态
- 未知字段
- HTTP(S) 项目链接
- 图片 key
- 同类内容重复 slug

Markdown Raw HTML 已关闭。

`draft: true` 的内容只在开发环境中可见；生产列表、详情、搜索索引、Sitemap 和 RSS 都不会包含 draft。

### 搜索

站内搜索使用 `⌘/Ctrl + K` 打开。

搜索索引由服务端从已发布的 Projects、Notes、Lab 和固定页面生成。页面首次打开搜索时才请求 `/api/search-index`，随后复用当前页面生命周期内的内存缓存，避免把整份索引内联到每个 SSR 页面。

### SEO

页面会输出：

- 独立 title 与 description
- canonical URL
- Open Graph metadata
- Twitter Card metadata
- OG 图片尺寸
- JSON-LD
- Sitemap
- robots.txt
- RSS

首页输出 `WebSite` 与 `Person` JSON-LD；笔记使用 `BlogPosting`；项目使用 `SoftwareApplication`；实验详情使用 `CreativeWork`。

404 与 500 页面会明确输出 `noindex`。

生产 base URL 只在 `src/data.ts` 中维护：

```text
https://0u0w0u0.com/
```

### 图标与主屏幕支持

站点同时提供：

```text
/static/favicon.svg
/static/favicon-32x32.png
/static/apple-touch-icon.png
```

HTML 同时声明 SVG favicon、32×32 PNG fallback 与 180×180 Apple Touch Icon，以覆盖现代浏览器、旧版 favicon 场景以及 iPhone/iPad 添加到主屏幕。

### 性能

- 首屏 Hero WebP preload
- 图片包含 intrinsic width / height，降低 CLS
- 内容图片使用 WebP + fallback
- 折叠线下图片 lazy loading
- Manrope 与 Caveat 字体自托管
- 搜索索引按需加载
- 手机端使用独立 Hero 背景构图，避免 16:9 图片在竖屏中过度裁切
- 静态资源采用可更新缓存策略

### 可访问性

- Skip link
- `focus-visible`
- 移动端菜单焦点管理
- Search dialog 焦点与键盘控制
- Lightbox Escape / 方向键 / 焦点恢复
- `inert`
- `aria-hidden`
- `aria-expanded`
- 明确 accessible names
- `prefers-reduced-motion` 支持

## Security

Hono SSR 响应会生成逐请求 nonce，并发送严格 Content Security Policy。

当前应用层响应头包括：

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `frame-ancestors 'none'`

`public/_headers` 为 Worker 直接返回的静态资源补充缓存和安全响应头。

HTTP → HTTPS、WWW 重定向、TLS 与 HSTS 属于 Cloudflare Zone / Edge 配置，不在仓库源码中维护；修改这些设置后应直接验证生产响应。

## 项目结构

```text
content/
├── lab/                       # 实验 Markdown
├── notes/                     # 笔记 Markdown
└── projects/                  # 项目 Markdown

public/
├── _headers                   # Static Assets headers
└── static/
    ├── assets/                # 图片与 WebP
    ├── fonts/                 # 自托管字体
    ├── js/                    # Vanilla ES Modules
    ├── favicon.svg
    ├── favicon-32x32.png
    ├── apple-touch-icon.png
    └── style.css

src/
├── components/                # Layout / Sections / Pages / Shared JSX
├── content/                   # Markdown 解析、校验、查询
├── data.ts                    # 站点、导航、图片配置
├── index.tsx                  # Hono routes / Worker entry
├── renderer.tsx               # HTML shell / metadata
├── search.ts                  # Search index
└── seo.ts                     # Canonical / Sitemap / RSS / robots

e2e/
└── site.spec.mjs              # Playwright browser tests

.github/workflows/ci.yml
playwright.config.mjs
vite.config.ts
wrangler.jsonc
```

## 环境要求

- Node.js `>=24 <25`
- npm

推荐使用仓库 `.nvmrc` 指定的 Node 版本。

## 本地开发

```bash
git clone https://github.com/yy611185/0u0w0u0.com.git
cd 0u0w0u0.com
npm ci
npm run dev
```

首次运行 Playwright 前安装 Chromium：

```bash
npx playwright install chromium
```

## 常用命令

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
npm run lint
npm run format
npm run format:check
npm run test
npm run test:e2e
npm run cf-typegen
```

其中：

- `npm run test`：Vitest 单元测试
- `npm run test:e2e`：Playwright Chromium 浏览器测试
- `npm run build`：生成 Worker bundle 与 Static Assets
- `npm run preview`：在本地 Workers 环境预览生产构建
- `npm run cf-typegen`：重新生成 Cloudflare binding 类型

## 内容维护

### Note

在 `content/notes/` 新建 `.md`：

```yaml
---
title: 标题
slug: url-safe-slug
date: 2026-09-06
updated: 2026-09-06
description: 页面与搜索摘要
tags:
  - 标签
draft: false
---
```

### Project

在 `content/projects/` 新建 `.md`，除通用字段外还需要：

```yaml
tagline: 一句话定位
cover: yangfolio
status: active
repository: ''
demo: ''
stack:
  - TypeScript
featured: true
```

`status` 只能是：

```text
active
complete
archived
```

非空 `repository` 和 `demo` 必须使用 HTTP(S) URL。

### Lab

在 `content/lab/` 新建 `.md`，除通用字段外还需要：

```yaml
status: WIP
stack:
  - CSS
emoji: 🧪
```

`status` 只能是：

```text
LIVE
BETA
WIP
```

## CI 与分支策略

`.github/workflows/ci.yml` 会在 Pull Request 和 `main` push 时运行 `verify`：

```text
npm ci
  ↓
typecheck
  ↓
ESLint
  ↓
Prettier
  ↓
Vitest
  ↓
Vite production build
  ↓
Install Chromium
  ↓
Playwright browser tests
```

`main` 由仓库 Ruleset 保护。正常开发流程为：

```text
feature / fix branch
        ↓
Pull Request
        ↓
required verify CI
        ↓
merge
        ↓
main
        ↓
Cloudflare production deployment
```

不要直接绕过 PR 修改 `main`。

## Cloudflare Workers

`wrangler.jsonc` 当前配置：

- Worker name: `ouowouo-digital-garden`
- Entry: `src/index.tsx`
- `nodejs_compat`
- Workers Static Assets
- 无尾斜杠 HTML 策略
- Workers Logs
- 1% trace sampling

当前没有 D1、R2、KV、Turnstile 等 production binding。

未来增加 binding 后应重新运行：

```bash
npm run cf-typegen
npm run typecheck
```

Secrets 不应提交到源码或 `wrangler.jsonc`。本地 secret 使用 Git 忽略的 `.dev.vars`，生产 secret 由 Cloudflare 管理。

## 发布检查

生产发布后建议至少验证：

```text
/
/projects
/notes
/lab
/photos
/about
/now
/sitemap.xml
/robots.txt
/rss.xml
/random-404-path
```

同时检查：

- HTTP status
- HTTPS / redirect behavior
- canonical
- Open Graph metadata
- CSP 与其他安全响应头
- Static Assets cache headers
- Ctrl/Cmd + K 搜索
- Mobile drawer
- Lightbox
- iPhone Safari
- Desktop Chrome
- Lighthouse Mobile / Desktop

## 设计原则

这个项目优先保持简单、快速、可读和长期可维护：

- SSR 优先，而不是为了交互引入完整 SPA
- 内容优先，而不是为了少量 Markdown 引入 CMS
- 原生浏览器能力优先，而不是增加不必要的客户端依赖
- 所有生产代码通过 CI 和真实浏览器测试后进入 `main`
- 基础设施设置与应用代码分离，Cloudflare Edge 配置不伪装成仓库源码
