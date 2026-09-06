# OuOw Design System v1.0

> **Design Language:** Midnight Garden / 深夜数字花园  
> **适用项目:** `0u0w0u0.com` 及其后续个人 Web 项目

适用于：

- Home
- Projects
- Notes
- Lab
- Now
- Photos
- About
- Search / Command Palette
- 后续个人 Web 项目

---

## 1. 品牌设计方向

OuOwOuO 不是 SaaS 产品，也不是传统个人简历站。

设计目标是：

**安静、好奇、个人化、精致、有生命力。**

视觉配比：

**80% Midnight Editorial  
15% Soft Glass  
5% Playful / Experimental**

即：

> 内容和排版负责高级感，玻璃和光影负责氛围，动效只负责惊喜。

避免把页面做成：

- 大量发光
- 大量渐变
- 每张卡片 3D
- Rainbow UI
- 所有元素玻璃化
- AI SaaS Dashboard 风
- 炫技式前端 Demo

---

## 2. Core Principles

### 2.1 Content First

内容永远高于视觉效果。

视觉层级顺序：

**Content → Typography → Spacing → Color → Motion → Effects**

不能依赖 Glow / Blur / Gradient 来制造层级。

### 2.2 Accent Scarcity

一个页面主要由：

**约 88–90% 中性色  
约 8–10% 紫色品牌色  
≤2% 暖色惊喜**

组成。

紫色越少，品牌感越强。

### 2.3 One Wow Moment

每个 viewport / Section 最多允许：

**1 个主要视觉效果 + 1 个辅助微交互。**

例如：

Hero：

- Ambient Gradient
- Scroll Reveal

Project：

- Image Zoom
- Border Highlight

Lab：

- 3D Tilt

而不是同时 Spotlight + Tilt + Beam + Glow + Particle。

---

## 3. Color System

### 3.1 Neutral / Midnight

| Token           | Value     | Usage            |
| --------------- | --------- | ---------------- |
| `canvas`        | `#0B0F1E` | 页面背景         |
| `surface-1`     | `#111634` | 普通 Surface     |
| `surface-2`     | `#1A2044` | Card             |
| `surface-3`     | `#1E2550` | Modal / Floating |
| `surface-hover` | `#232A54` | Hover / Elevated |

### 3.2 Text

| Token            | Value     |
| ---------------- | --------- |
| `text-primary`   | `#F4F2FF` |
| `text-secondary` | `#C9C8E6` |
| `text-tertiary`  | `#A5A4CC` |
| `text-muted`     | `#8586AA` |

禁止使用纯：

- `#000000`
- `#FFFFFF`

作为常规背景或正文。

---

## 4. Brand Colors

### 4.1 Primary — OuOw Lavender

`#B8A4FF`

用途：

- 链接
- Focus
- Active
- 重点关键词
- Selected State
- 极少量品牌装饰

更强状态：

`#8A7CFF`

### 4.2 Spark — OuOw Warm

`#FFCF7A`

这是 OuOwOuO 的「小惊喜色」。

仅用于：

- Hero Spark
- 小型插画
- 个别手写标记
- 极少量视觉强调

不能用于普通按钮或大面积背景。

### 4.3 Semantic

| Role    | Value     |
| ------- | --------- |
| Success | `#9BE3B7` |
| Info    | `#7AD3FF` |
| Warning | `#F5C86F` |
| Danger  | `#FF8FA3` |

这些颜色只代表状态。

不能拿 Success Green 给卡片做装饰。

---

## 5. Border System

深色界面主要通过 **Border 而不是 Shadow** 表达层级。

```css
--border-subtle: rgba(255, 255, 255, 0.08);
--border-default: rgba(255, 255, 255, 0.11);
--border-strong: rgba(255, 255, 255, 0.16);
--border-accent: rgba(184, 164, 255, 0.35);
```

默认 Card：

`border-subtle`

Hover：

`border-default`

Featured / Selected：

`border-accent`

---

## 6. Typography

### 6.1 Font Family

#### UI / Content

**Manrope**

Fallback：

`PingFang SC → Microsoft YaHei → Noto Sans CJK SC → sans-serif`

#### Personality

**Caveat**

Caveat 只允许用于：

- OuOwOuO Wordmark
- 手写签名
- Quote Signature
- 极少量装饰文字

禁止 Caveat 用于：

- 正文
- Button
- 导航
- 普通页面 H1
- 项目标题

---

## 7. Typography Scale

### Brand Display

`56–108px`

Caveat / 700

仅 Hero 的 OuOwOuO 使用。

### Display

```text
48–72px
line-height: 1.05
weight: 600
letter-spacing: -0.04em
```

页面大型 Hero 标题。

### H1

```text
40–56px
line-height: 1.1
weight: 600
```

### H2

```text
30–40px
line-height: 1.2
weight: 600
```

### H3

```text
20–24px
line-height: 1.35
weight: 600
```

### Body Large

`18px / 1.7`

### Body

`16px / 1.7`

### Article

`17px / 1.9`

### Small

`14px / 1.6`

### Meta

`12px / 1.5`

可使用：

```css
letter-spacing: 0.08em;
text-transform: uppercase;
```

数字统一使用：

```css
font-variant-numeric: tabular-nums;
```

---

## 8. Font Weight

全站主要只允许：

`400 / 500 / 600`

700 仅用于：

- Wordmark
- 极特殊的小型 Status
- Caveat

避免出现大量粗体。

层级优先通过：

**Size → Space → Color → Weight**

建立。

---

## 9. Content Width

### Main Container

```css
--container-wide: 1200px;
```

保持当前网站宽度。

### Standard Content

`960px`

### Article

`740px`

---

## 10. Spacing System

采用严格 4px Grid。

核心 Token：

```text
4
8
12
16
24
32
48
64
80
96
120
```

禁止随手出现：

- `13px`
- `27px`
- `37px`
- `53px`

除非属于：

- 字体 optical adjustment
- 图片定位
- 数学计算结果

### Component

内部：

`8 / 12 / 16 / 24`

### Card Gap

`16 / 24 / 32`

### Section

Desktop：

`96–120px`

Tablet：

`72–96px`

Mobile：

`64–80px`

推荐统一使用：

```css
--section-space: clamp(64px, 8vw, 120px);
```

---

## 11. Radius System

OuOwOuO 本身更加柔和，因此采用：

```css
--radius-sm: 8px;
--radius-md: 16px;
--radius-lg: 24px;
--radius-pill: 999px;
```

### 使用规则

**8px**

- Code
- Tooltip
- 小型 UI

**16px**

- Normal Card
- Input
- Search Result

**24px**

- Feature Card
- Image
- Dialog
- Bento

**Pill**

- Button
- Badge
- Chip

禁止继续同时出现：

`10 / 12 / 16 / 22 / 24 / 25 / 32px`

---

## 12. Shadow System

Dark Mode 不依赖 Shadow 建立普通层级。

### Soft

```css
0 8px 24px rgba(0,0,0,.20)
```

### Floating

```css
0 20px 60px rgba(0,0,0,.35)
```

### Accent Glow

```css
0 0 40px rgba(184,164,255,.16)
```

Glow 只允许：

- Hero
- Featured Project
- Focused visual

普通 Card 禁止 Glow。

---

## 13. Glass System

Glass 是 OuOwOuO 的辅助语言，不是主语言。

标准：

```css
background: rgba(17, 22, 52, 0.72);

border: 1px solid rgba(255, 255, 255, 0.1);

backdrop-filter: blur(20px) saturate(135%);
```

只推荐用于：

- Navigation
- Command Palette
- Modal
- Floating Panel
- Project Facts
- 少数 Featured Card

普通内容卡不要全部 Glass。

---

## 14. Motion System

```css
--motion-fast: 150ms;
--motion-base: 240ms;
--motion-slow: 480ms;

--ease-out: cubic-bezier(0.22, 1, 0.36, 1);
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 15. Motion Rules

### Hover

最大位移：

`translateY(-2px)`

Card scale：

最大：

`1.01`

Image scale：

最大：

`1.03`

### Press

```css
transform: scale(0.98);
```

### Scroll Reveal

```text
translateY: 16px
scale: .99
opacity: 0 → 1
duration: 480ms
```

不要使用 30–50px 大幅飞入。

---

## 16. Effects Budget

### 全局允许

- Scroll Reveal
- Ambient Gradient

### Hero

允许：

- Background Blur
- Ambient Light
- Spark

不增加：

- Particle
- Cursor Trail
- 3D
- Border Beam

### Projects

允许：

- Image Zoom
- Border Spotlight

Featured Project 可额外使用：

- 极弱 3D Tilt

### Lab

这是唯一可以比较大胆实验的区域。

允许：

- Tilt
- Magnetic
- Border Beam
- Experimental Interaction

但每张卡也不能全部使用。

### Notes

**几乎零装饰效果。**

只保留：

- Typography
- Reading Progress
- Link Interaction
- Scroll Reveal

阅读体验优先。

### Photos

只保留：

- Image Hover
- Lightbox
- Gallery transition

禁止粒子、发光等干扰照片。

---

## 17. Button System

只保留三种。

### Primary

Near White。

```text
BG       #F4F2FF
Text     #17182A
Height   44px
Radius   Pill
```

一个 Section 最多一个 Primary。

### Secondary

Glass / Outline。

```text
background rgba(255,255,255,.05)
border    border-default
text      text-primary
```

### Ghost

透明背景。

用于：

- 查看全部
- 返回
- 次级导航
- 小操作

### 删除

现有 Navbar 中的：

**紫色渐变 CTA**

建议取消。

不要同时存在：

- White Primary
- Purple Gradient Primary

否则两套视觉层级会互相抢注意力。

---

## 18. Interactive Target

所有可点击元素：

**minimum 44 × 44px**

因此：

```text
nav-search 38×38
hamburger  38×38
```

建议改成：

**44×44**

内部 Icon 仍然保持：

`18–20px`

---

## 19. Card System

只保留四类。

### Card / Base

普通内容。

### Card / Feature

重点项目、重点文章。

### Card / Glass

Overlay / 浮层。

### Card / Media

照片、Project Preview。

不要每个 Section 都发明一种新卡片。

---

## 20. Bento System

首页推荐使用 Bento，但不强制所有页面 Bento 化。

适合：

- Now
- Featured Projects
- About
- Current Focus
- Lab Preview

Desktop：

12-column Grid

Tablet：

6-column

Mobile：

1 column

Gap：

`16–24px`

---

## 21. Navigation

### Desktop

高度建议：

`72px`

导航使用：

**Floating Glass Bar**

Active：

文字变亮 + `1.5px` 紫色 underline。

不要使用大面积紫色背景表示当前页。

### Mobile

高度：

`64px`

入口：

- Brand
- Search
- Menu

Drawer 内触控面积：

`≥44px`

---

## 22. Command Palette

`⌘ / Ctrl + K`

应该成为 OuOwOuO 的核心交互之一。

保留并统一设计。

结构：

```text
Search Input
────────────
Pages
Projects
Notes
Lab
────────────
Keyboard Help
```

Highlight：

使用非常弱的紫色 Surface。

不要整行高亮成亮紫色。

---

## 23. Icons

统一：

**Outline Icon**

```text
16 / 20 / 24px
stroke ≈ 1.75–1.8
round cap
round join
```

不要混用：

- Outline
- Filled
- Emoji

作为系统 UI。

Emoji 可以继续用于：

- Lab
- Now
- Content
- 个性表达

但 Emoji 属于「内容」，不是 System Icon。

---

## 24. Image System

图片应该承担 OuOwOuO 很大一部分人格。

关键词：

- Night
- City
- Desk
- Cat
- Light
- Life fragments

### Radius

普通：

`16px`

Featured：

`24px`

### Hover

```text
scale 1 → 1.03
480ms
```

图片上不要统一覆盖紫色滤镜。

保持真实摄影质感。

---

## 25. Responsive System

标准断点：

```text
sm    640
md    768
lg    1024
xl    1280
```

额外允许针对横屏手机使用 Height Query。

### Mobile First

手机：

1 column

Tablet：

1–2 column

Desktop：

2–4 column

### Bottom Line

320px：

**绝不能横向溢出。**

Hover 效果必须有 Touch 替代。

---

## 26. Z-Index

全站只允许：

```css
--z-base: 0;
--z-raised: 10;
--z-dropdown: 20;
--z-nav: 40;
--z-modal: 50;
--z-toast: 60;
```

禁止：

```css
z-index: 999;
z-index: 9999;
z-index: 100000;
```

---

## 27. Focus

统一：

```css
outline: 2px solid #b8a4ff;
outline-offset: 3px;
```

仅：

`:focus-visible`

显示。

---

## 28. Accessibility

必须满足：

正文：

`≥ 4.5 : 1`

大型文字：

`≥ 3 : 1`

UI / Border：

`≥ 3 : 1`

同时必须：

- keyboard usable
- clear focus
- reduced motion
- semantic HTML
- proper ARIA
- ESC closes overlays
- focus restoration
- 44px touch targets

---

## 29. Dark / Light Mode

### v1 Recommendation

**Dark-first。**

暂时不要为了“设计系统完整”而硬加 Light Mode。

Midnight 本身就是 OuOwOuO 品牌身份的一部分。

但所有颜色必须使用 Semantic Token：

```text
color-canvas
color-surface
color-text
color-border
color-accent
```

这样未来要加入 Light Theme 时无需重构组件。

---

## 30. 首页效果分配

### Hero

保留：

- Night Hero Image
- Ambient Purple Glow
- Warm Spark
- Scroll Hint
- Reveal

不增加：

- Particle
- Cursor Trail
- 3D
- Border Beam

### Explore / Now

使用：

**Bento Grid**

效果：

Scroll Reveal + subtle card hover

### Featured Projects

使用：

Large Media Card

效果：

Image Zoom + Border Highlight

Featured 项目：

可允许一次 Spotlight。

### Notes

采用：

Editorial List

而不是继续增加 Card。

### Quote

保留 Caveat / Warm Accent。

它应该成为网站个性的重要组成，而不是新增更多颜色。

### Lab

这里承担整个网站的“实验性”。

可以借鉴 UI Handbook：

- Magnetic Button
- 3D Tilt
- Border Spotlight
- Experimental Motion

### Photos

保持安静。

让照片本身成为视觉核心。

---

## 31. 最终视觉公式

OuOwOuO 应该遵循：

> **Midnight Canvas
>
> - Strong Typography
> - Quiet Glass
> - Lavender Accent
> - Warm Spark
> - Natural Photography
> - Restrained Motion**

而不是：

> Glass + Glow + Gradient + Animation + Particle + 3D

---

## 32. Design Review Rule

任何新 UI 上线前问六个问题：

### 1. 这个颜色是否已经存在 Token？

没有 → 不允许直接创建。

### 2. 这个间距是不是现有 spacing token？

不是 → 优先修改布局，而不是发明新数值。

### 3. 这个 Radius 是 8 / 16 / 24 / Pill 吗？

不是 → 原则上不能使用。

### 4. 这个动效是否帮助理解？

不是 → 删除。

### 5. 同一屏是不是已经有一个视觉重点？

是 → 不允许再加第二个强特效。

### 6. 手机和 reduced-motion 是否仍能完整使用？

不能 → 不允许上线。

---

# OuOw DS Principle

最终只记一句：

> **Less UI, more Yang.**

OuOwOuO 的个性应该来自：

内容、项目、文字、照片与细节，

而不是来自堆叠特效。
