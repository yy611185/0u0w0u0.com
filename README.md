# OuOwOuO — Yang 的数字花园

## 项目概览
- **名称**：OuOwOuO（webapp）
- **目标**：Yang 的个人网站 / 数字花园——自我介绍、项目作品、笔记、实验室（Lab）、照片墙、近况与联系方式。
- **调性**：深夜紫蓝色调 + 玻璃拟态（glassmorphism）+ Caveat 手写体 + 标志性的猫。
- **来源**：由 Genspark Design 交接（`designer2-19042f07-…` / `design_handoff_ouowouo_site.zip`），按 README 规范 1:1 高保真复刻。

## URL
- **沙盒预览**：https://3000-igkga7u9z3tzyv92c24oc-5c13a017.sandbox.novita.ai
- **生产环境**：尚未部署（见下方「部署」）

## 已完成功能
- 单页锚点式站点，10 个 section：Hero / Explore(含 Now · Projects · Notes · About · Stats) / The Lab / Photo Wall / All Projects / Contact(Footer)
- 固定顶部胶囊导航（玻璃拟态），移动端汉堡菜单 + Drawer（ESC / 遮罩 / 点击链接关闭，`aria-expanded` 同步）
- `⌘/Ctrl + K` 全站搜索模态框（↑↓ 选择、Enter 打开、Esc 关闭，按 项目/笔记/实验/页面 分组）
- 响应式断点：`<1024px` 平板、`<640px` 手机；`prefers-reduced-motion` 支持；Skip link；统一 focus-visible
- 所有位图 `<picture>` WebP 主源 + PNG/JPG 回落

### 背景图（本次需求重点）
`#lab` / `#photos` / `#all-projects` 三节共用夜景猫咪背景 `bg-night-cat`。交接包中的 `bg-night-cat.jpg` 已重新编码为合适格式：

| 文件 | 尺寸 | 大小 | 用途 |
|---|---|---|---|
| `public/static/assets/webp/bg-night-cat.webp` | 1500×843 | 55 KB | 桌面端主背景（WebP） |
| `public/static/assets/webp/bg-night-cat-900.webp` | 900×506 | 28 KB | `≤768px` 移动端背景（WebP） |
| `public/static/assets/bg-night-cat.jpg` | 1500×843 | 110 KB | 渐进式 JPEG 回落（旧浏览器） |

CSS 使用 `image-set(… type('image/webp'), … type('image/jpeg'))` 自动选格式，并用 `@supports` 为不支持 `image-set` 的浏览器回落到 JPEG；移动端 `background-attachment: scroll`。`<head>` 中对桌面端预加载 WebP。

## 功能入口
| 路径 | 说明 |
|---|---|
| `/` | 主页（SSR，Hono JSX） |
| `/#lab` `/#photos` `/#all-projects` `/#contact` 等 | 各 section 锚点 |
| `/api/search-index` | 搜索索引 JSON（同时内联在页面 `#site-data` 中） |
| `/static/style.css` `/static/app.js` | 样式与前端交互脚本 |
| `/static/assets/**` | 图片资源（`webp/` 子目录为 WebP 版本） |

## 数据架构
- **内容源**：`src/data.ts` — 站点配置（社交链接）、导航、项目、笔记、Lab、Now、统计、照片、搜索索引。纯静态，无数据库。
- **渲染**：`src/renderer.tsx`（`<head>` / SEO / 字体）→ `src/index.tsx`（路由）→ `src/components/*`（Nav、Drawer、Footer、SearchModal、各 Section）。
- **前端状态**：`public/static/app.js` 管理 `isDrawerOpen`、`isSearchOpen`、`searchQuery`、`activeResultIndex`；数据通过页面内 `<script type="application/json" id="site-data">` 注入。

## 项目结构
```
webapp/
├── src/
│   ├── index.tsx            # Hono 入口 & 路由
│   ├── renderer.tsx         # HTML 外壳、SEO、字体、预加载
│   ├── data.ts              # 全站内容/配置
│   └── components/
│       ├── shared.tsx       # Picture / SectionHead / TagList / Card
│       ├── layout.tsx       # Nav / MobileDrawer / Footer / SearchModal
│       └── sections.tsx     # Hero / Explore / Lab / Photos / AllProjects
├── public/static/
│   ├── style.css            # 设计 token + 全部样式
│   ├── app.js               # Drawer / 搜索 / 社交链接注入
│   ├── favicon.svg
│   └── assets/              # PNG/JPG 原图 + webp/ 目录
├── ecosystem.config.cjs     # PM2（沙盒开发）
├── wrangler.jsonc
└── vite.config.ts
```

## 使用指南
- 顶部导航或 Drawer 点击锚点平滑滚动到对应 section。
- 按 `⌘K` / `Ctrl+K` 或点击 🔍 打开搜索，输入关键词（如「AI」「笔记」）后用方向键 + Enter 跳转。
- 修改内容：编辑 `src/data.ts`；替换真实社交链接在 `SITE.social`。

## 待办 / 未实现
- 项目 / 笔记 / Lab 详情页（当前为锚点回落，建议 `/projects/[slug]` 等路由）
- Photo Wall 后 3 张占位需补真实照片；`og-image.jpg` 1200×630
- Analytics 接入
- 生产部署

## 开发
```bash
npm run build                        # 构建到 dist/
pm2 start ecosystem.config.cjs       # 沙盒启动 wrangler pages dev（端口 3000）
curl http://localhost:3000           # 验证
```

## 部署
- **平台**：Cloudflare Pages（Hono + Vite）
- **状态**：⏳ 未部署（本地 / 沙盒预览可用）
- **技术栈**：Hono 4 · TypeScript · Hono JSX (SSR) · 原生 CSS（设计 token）· 原生 JS
- **最后更新**：2026-09-05
