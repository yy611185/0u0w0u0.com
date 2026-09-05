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
- 单页锚点式站点：Hero / Explore(含 Now · Projects · Notes · About · Stats) / The Lab / Photo Wall / All Projects / Contact(Footer)
- 固定顶部胶囊导航（玻璃拟态）+ 滚动加深状态 + **当前 section 高亮**（`aria-current`）
- 移动端汉堡菜单 + Drawer（ESC / 遮罩 / 点击链接关闭，焦点锁定 + 背景 `inert`）
- `⌘/Ctrl + K`（或 `/`）全站搜索（↑↓/Home/End 选择、Enter 打开、Esc 关闭，combobox + `aria-activedescendant`）
- **照片 Lightbox**：点击放大、←/→ 翻页、Esc 关闭、焦点锁定与归还
- 响应式断点：1024 / 820 / 640 / 380px + 横屏手机；`prefers-reduced-motion` 全量支持
- 所有位图 `<picture>` WebP 主源 + JPG/PNG 回落，并携带 `width`/`height`/`sizes`（CLS = 0）

### 动效系统
统一的 motion token（`--duration-fast|normal|slow` + 三条 easing 曲线），所有动画只使用 `transform` / `opacity`：

| 场景 | 实现 |
|---|---|
| 页面加载 | Navbar → 标题 → 副标题 → 标签 → CTA → 滚动提示，间隔 90ms，~1.0s 内完成 |
| 滚动进入 | IntersectionObserver，`opacity 0→1` + `translateY 24px→0`，同组 70ms 递进，只触发一次 |
| Hero | 背景 / 文字微视差（≤10px）、spark 3px 漂浮、滚动后提示淡出 |
| 卡片 | `translateY(-2~3px)` + border / shadow 变化 |
| 图片 | Hover `scale(1.04~1.05)`（外层 `overflow:hidden`） |
| Lab 卡片 | 指针感知 ±1.5° tilt（仅 fine pointer） |
| 按钮 | Hover `translateY(-1~2px)`、Active `scale(0.98)`、统一 focus-visible |

动效均以 `html.js` 为前缀：无 JS 时页面完整可见；并有多轮兜底 sweep，保证任何元素都不会卡在 `opacity: 0`。

### 图片资产优化
不透明的照片原本用 PNG 做回落（1.1–1.6 MB / 张），已全部转为渐进式 JPEG；带 alpha 的两张猫重新量化；删除未使用的 `logo-wordmark`；新增 `og-image.jpg`（1200×630）。

| 项 | 优化前 | 优化后 |
|---|---|---|
| 回落位图总体积 | 7.5 MB | 0.7 MB（**− 6.8 MB**）|

### 背景图
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
| `/static/style.css` | 设计 token + 全部样式 |
| `/static/js/main.js` | ES module 入口（内部引入 core / animations / navigation / search / lightbox / interaction）|
| `/static/assets/**` | 图片资源（`webp/` 子目录为 WebP 版本） |

## 数据架构
- **内容源**：`src/data.ts` — 站点配置（社交链接）、导航、项目、笔记、Lab、Now、统计、照片、搜索索引。纯静态，无数据库。
- **渲染**：`src/renderer.tsx`（`<head>` / SEO / 字体）→ `src/index.tsx`（路由）→ `src/components/*`（Nav、Drawer、Footer、SearchModal、各 Section）。
- **前端状态**：每个行为模块自己持有状态（drawer / search / lightbox 各自局部）；数据通过页面内 `<script type="application/json" id="site-data">` 注入。滚动锁用计数器共享，避免多弹层互相解锁。

## 项目结构
```
webapp/
├── src/
│   ├── index.tsx            # Hono 入口 & 路由
│   ├── renderer.tsx         # HTML 外壳、SEO、字体、预加载
│   ├── data.ts              # 全站内容/配置
│   └── components/
│       ├── shared.tsx       # Picture / SectionHead / TagList / Arrow / Card
│       ├── layout.tsx       # Nav / MobileDrawer / Footer / SearchModal / Lightbox
│       └── sections.tsx     # Hero / Explore / Lab / Photos / AllProjects
├── public/static/
│   ├── style.css            # 设计 token + motion token + 全部样式
│   ├── js/
│   │   ├── main.js          # 入口：依次启动各模块
│   │   ├── core.js          # 共享工具：滚动锁 / 焦点锁定 / inert / rAF 节流
│   │   ├── animations.js    # 加载序列 / 滚动揭示 / Hero 视差
│   │   ├── navigation.js    # 滚动状态 / 当前 section / Drawer / 锚点滚动
│   │   ├── search.js        # ⌘K 命令面板
│   │   ├── lightbox.js      # 照片查看器
│   │   └── interaction.js   # Lab 卡片指针 tilt
│   ├── favicon.svg
│   └── assets/              # JPG/PNG 回落 + webp/ 目录 + og-image.jpg
├── ecosystem.config.cjs     # PM2（沙盒开发）
├── wrangler.jsonc
└── vite.config.ts
```

## 使用指南
- 顶部导航或 Drawer 点击锚点平滑滚动到对应 section。
- 按 `⌘K` / `Ctrl+K` 或点击 🔍 打开搜索，输入关键词（如「AI」「笔记」）后用方向键 + Enter 跳转。
- 修改内容：编辑 `src/data.ts`；替换真实社交链接在 `SITE.social`。

## 可访问性
- 语义标签：`<ul>` 列表化的 hero 标签 / 项目 tag / 社交链接；`<time datetime>`；`<figure>/<figcaption>`
- 键盘：Drawer / 搜索 / Lightbox 均支持 Tab 锁定、Esc 关闭、焦点归还；背景上 `inert`
- 焦点：全站统一 `focus-visible` 描边；hover 效果均有 `:focus-visible` 对应态
- 装饰图 `alt=""`，内容图均有描述性 alt；占位卡 `aria-hidden`
- 所有 hover 样式包在 `@media (hover: hover) and (pointer: fine)`，触屏不会“粘住” hover 态

## 待办 / 未实现
- 项目 / 笔记 / Lab 详情页（当前为锚点回落，建议 `/projects/[slug]` 等路由）
- Photo Wall 后 3 张仍为占位（需补真实照片）
- `SITE.social` 三个链接仍为占位（GitHub / X / Email）
- 字体仍走 Google Fonts CDN（可进一步自托 woff2 + subset）
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
- **最后更新**：2026-09-05（前端体验与交互优化阶段）
