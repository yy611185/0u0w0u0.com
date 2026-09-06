# OuOwOuO — Yang 的数字花园

OuOwOuO 是一个以 Hono JSX 服务端渲染的多页面个人网站，用来持续发布项目、笔记、实验与生活记录。浏览器端只加载导航、搜索、动效和照片查看器所需的 Vanilla ES Modules，不使用 SPA 或 React Hydration。

Production URL：<https://0u0w0u0.com/>

## 技术栈

- Hono 4 + Hono JSX SSR
- TypeScript（strict）
- Vite 8 + Cloudflare 官方 Vite 插件
- Cloudflare Workers + Static Assets
- MarkdownIt 内容解析
- Vanilla JavaScript、原生 CSS、WebP 与自托管 WOFF2 字体
- ESLint、Prettier、Vitest、Playwright、GitHub Actions

## 架构

```text
Browser
   ↓
Cloudflare Workers Static Assets（图片、字体、CSS、JS）
   ↓ 未匹配静态文件的请求
Hono Worker（SSR、内容路由、搜索 API、SEO feeds）
```

Cloudflare 官方 Vite 插件让开发和预览都运行在 Workers 的 `workerd` 环境中。Vite 构建后会生成供 Wrangler 使用的输出配置；根目录的 `wrangler.jsonc` 始终是人工维护的配置源。

## 目录结构

```text
content/
├── lab/                    # 实验 Markdown
├── notes/                  # 笔记 Markdown
└── projects/               # 项目 Markdown
public/
├── _headers                # Static Assets 缓存与安全响应头
└── static/
    ├── assets/             # 图片与 WebP
    ├── fonts/              # 自托管 WOFF2 与 OFL license
    ├── js/                 # Vanilla ES Modules
    ├── favicon.svg
    └── style.css
src/
├── components/             # 布局、页面与共享 JSX
├── content/                # 内容解析、校验、查询
├── data.ts                 # 站点、导航、图片等配置
├── index.tsx               # Hono 路由与 Worker 入口
├── renderer.tsx            # 文档框架与页面 metadata
├── search.ts               # 搜索索引
└── seo.ts                  # URL、Sitemap、RSS、robots 工具
e2e/
└── site.spec.mjs           # Playwright 浏览器 smoke tests
.github/workflows/ci.yml
eslint.config.js
playwright.config.mjs
vite.config.ts
wrangler.jsonc
```

## 环境要求

- Node.js 24 LTS；推荐使用 `.nvmrc` 中的 `24.20.0`
- npm 11+

项目 `engines` 限定 Node 24，以统一 Vite、Vitest、ESLint 和 Wrangler 的运行环境。

## 安装

```powershell
Set-Location "D:\0u0w0u0.com"
npm install
```

CI 和可复现环境使用：

```powershell
npm ci
```

Playwright 测试依赖已固定在 `devDependencies` 与 `package-lock.json` 中。首次在本机运行浏览器测试前安装 Chromium：

```powershell
npx playwright install chromium
```

## 本地开发

```powershell
npm run dev
```

Vite 会启动本地 Workers 开发环境并显示访问地址。常用质量命令：

```powershell
npm run typecheck
npm run lint
npm run format
npm run format:check
npm run test
npm run test:e2e
```

`npm run test` 运行 Vitest 单元测试；`npm run test:e2e` 运行 Playwright 浏览器测试，并由 `playwright.config.mjs` 自动启动本地 preview server。

历史 `public/static/style.css` 被明确排除在全量 Prettier 重排之外，避免仅为格式产生大规模 CSS diff；新增 CSS 仍应沿用现有风格。

## Build 与本地预览

```powershell
npm run build
npm run preview
```

`npm run build` 会生成 Worker bundle、source map、Static Assets 目录和 Wrangler 输出配置。`npm run preview` 使用 `workerd` 预览最新构建，不会部署。

可进行不发布的 Wrangler 验证：

```powershell
npx wrangler --version
npx wrangler types
npm run build
npx wrangler deploy --dry-run
```

`--dry-run` 只编译并检查待上传内容，不会创建线上 deployment。

## 内容系统

Frontmatter 会在构建时校验必填字段、真实日期、`updated >= date`、URL-safe slug、枚举状态、未知字段、项目 HTTP(S) 链接、图片 key 与同类 slug 重复。Markdown Raw HTML 已关闭。

`draft: true` 的内容可以在开发环境查看；生产构建不会让它进入列表、详情或搜索索引。Sitemap 与 RSS 会再次显式过滤 draft。

### 添加 Note

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

### 添加 Project

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

`status` 只能是 `active`、`complete` 或 `archived`。`cover` 必须在 `src/content/projects.ts` 的图片映射中存在；非空的 `repository` 与 `demo` 必须是 HTTP(S) URL。

### 添加 Lab

在 `content/lab/` 新建 `.md`，除通用字段外还需要：

```yaml
status: WIP
stack:
  - CSS
emoji: 🧪
```

`status` 只能是 `LIVE`、`BETA` 或 `WIP`。

## 搜索

搜索索引由服务端从已发布的 Projects、Notes 与 Lab 内容生成。页面 HTML 不再内联整份索引；访客第一次打开 `⌘/Ctrl + K` 搜索时请求 `/api/search-index`，随后在当前页面生命周期内复用内存缓存。搜索 API 使用短时可更新缓存。

## SEO

- 所有页面输出独立的 title、description、canonical、Open Graph 与 Twitter metadata。
- Canonical 使用无尾斜杠策略，根路径除外。
- `/sitemap.xml` 从静态路由和发布内容自动生成。
- `/robots.txt` 允许正常抓取并指向 Sitemap。
- `/rss.xml` 自动收录已发布 Notes，使用绝对 URL。
- 首页输出 `WebSite` 与 `Person` JSON-LD；笔记输出 `BlogPosting`；项目输出 `SoftwareApplication`；实验详情输出 `CreativeWork`。
- 404 与 500 页面明确输出 `noindex`。
- Production base URL 只在 `src/data.ts` 维护：`https://0u0w0u0.com/`。

## 性能与可访问性

- 所有内容图片包含 intrinsic width/height、WebP/fallback 与异步解码；组件保留 `sizes` 接口，后续增加多尺寸 `srcset` 时无需改页面调用方。
- 首屏 hero WebP 使用 preload，详情 hero 使用高优先级；折叠线下图片使用 lazy loading。
- Manrope（400–700）与 Caveat（700）只自托管使用到的 Latin WOFF2；中文回退到系统字体。
- 静态资源使用可更新的缓存策略，不使用 `immutable`，因为当前文件名没有内容 hash。
- 动效在 `prefers-reduced-motion: reduce` 下停止循环、滚动 reveal、视差与 tilt。
- 导航、抽屉、搜索和 Lightbox 支持焦点圈、焦点陷阱、Escape、方向键与焦点恢复。
- 页面包含 skip link，弹层使用 `inert`、`aria-hidden`、`aria-expanded` 和明确的 accessible name。

## Security Headers

Hono SSR 响应使用逐请求 nonce 的 Content Security Policy，同时发送：

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `frame-ancestors 'none'`

`public/_headers` 为 Worker 直接返回的静态资源补充缓存和安全响应头。CSP 只允许本站脚本、样式、字体、图片和连接；没有第三方字体或 tracking 来源。SSR JSX 不输出 `style="..."` 属性，动画延迟由浏览器模块通过 CSSOM 设置，避免与严格的 `style-src 'self'` 冲突。

## Cloudflare 配置

`wrangler.jsonc` 使用当前 Workers 架构并配置：

- Hono Worker 入口 `src/index.tsx`
- 最新兼容日期
- `nodejs_compat`
- Workers Static Assets 的无尾斜杠 HTML 策略
- Workers Logs 与低采样率 traces

P2 不创建 D1、R2、KV、Turnstile 或其他 production binding。未来添加 binding 后，必须重新运行：

```powershell
npm run cf-typegen
npm run typecheck
```

不要手写 binding interface，也不要把 secret 写进源码或 `wrangler.jsonc`。本地 secret 使用已被 Git 忽略的 `.dev.vars`。

## CI

`.github/workflows/ci.yml` 在 pull request 和推送到 `main` 时执行：

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run format:check`
5. `npm run test`
6. `npm run build`
7. `npx playwright install --with-deps chromium`
8. `npm run test:e2e`

Playwright runner 本身由 `npm ci` 从锁定依赖安装，不再在 CI 中临时执行 `npm install --no-save`。CI 只验证代码，不进行 Cloudflare 部署。

## Production deployment

仓库刻意不提供会被误触的一键 deploy script。获得明确上线授权后，再执行以下流程：

1. 确认 Cloudflare 账户、Worker 名称和 `0u0w0u0.com` zone 归属正确。
2. 确认 Node 版本、干净工作区、CI 和全部本地质量命令通过。
3. 运行 `npm run build` 与 `npx wrangler deploy --dry-run`，检查 bundle、assets 和 bindings。
4. 在 Cloudflare 中确认 production custom domain/route、DNS 与预览 URL 策略。
5. 仅在授权后运行 `npx wrangler deploy`。
6. 上线后检查首页、内容详情、404、Sitemap、robots、RSS、安全响应头和缓存响应头。
7. 如需 Cloudflare Web Analytics，先从控制台取得真实配置；不要提交 token 或虚构 ID。

本项目当前是 production-ready 本地配置，尚未进行 production deployment、DNS 修改或远端资源创建。
