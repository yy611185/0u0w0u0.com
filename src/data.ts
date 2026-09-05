// Central content config — all copy comes from the design handoff (final Chinese copy).

export const SITE = {
  name: 'OuOwOuO',
  title: 'OuOwOuO — Yang 的数字花园',
  description: 'OuOwOuO — Yang 的数字花园，记录学习、创造、项目与生活。',
  url: 'https://ouowouo.com/',
  social: {
    github: 'https://github.com/',        // TODO: 替换为真实账号
    x: 'https://x.com/',                  // TODO: 替换为真实账号
    email: 'mailto:hello@ouowouo.com'     // TODO: 替换为真实邮箱
  }
}

export const NAV_LINKS = [
  { href: '#about', label: '关于' },
  { href: '#projects', label: '项目' },
  { href: '#notes', label: '笔记' },
  { href: '#lab', label: '实验室' },
  { href: '#now', label: '近况' },
  { href: '#photos', label: '照片' },
  { href: '#contact', label: '联系' }
]

/** Intrinsic dimensions are carried so every <img> can reserve layout space (CLS = 0). */
export type ImageAsset = { webp: string; fallback: string; alt: string; w: number; h: number }

const asset = (
  name: string,
  ext: 'png' | 'jpg',
  alt: string,
  w: number,
  h: number
): ImageAsset => ({
  webp: `/static/assets/webp/${name}.webp`,
  fallback: `/static/assets/${name}.${ext}`,
  alt,
  w,
  h
})

export const IMAGES = {
  heroScene: asset('hero-scene', 'jpg', '夜晚书桌场景', 1024, 576),
  catSleep: asset('cat-sleep', 'png', '午睡的猫', 1024, 768),
  catLaptop: asset('cat-laptop', 'png', '趴在笔电旁的猫', 819, 1024),
  nightCat: asset('bg-night-cat', 'jpg', '城市夜景与猫', 1500, 843),
  projectYangfolio: asset('project-yangfolio', 'jpg', 'Yangfolio 项目预览', 1024, 768),
  projectBlood: asset('project-blood', 'jpg', 'Blood Pressure Record 项目预览', 1024, 768),
  projectHermes: asset('project-hermes', 'jpg', 'Hermes 项目预览', 1024, 768)
}

export type Tag = { label: string; kind: 'finance' | 'web' | 'health' | 'data' | 'ai' | 'prod' | 'exp' }

export type Project = {
  id: string
  title: string
  tagline: string
  desc: string
  tags: Tag[]
  image: ImageAsset
}

export const PROJECTS: Project[] = [
  {
    id: 'project-yangfolio',
    title: 'Yangfolio',
    tagline: '个人投资管理系统',
    desc: '个人投资管理系统 · 组合、现金流、回撤一屏看清',
    tags: [{ label: '金融', kind: 'finance' }, { label: 'Web', kind: 'web' }],
    image: IMAGES.projectYangfolio
  },
  {
    id: 'project-blood',
    title: 'Blood Pressure Record',
    tagline: '记录，理解，改善',
    desc: '给家人的血压追踪工具，记录 → 理解 → 改善',
    tags: [{ label: '健康', kind: 'health' }, { label: '数据', kind: 'data' }],
    image: IMAGES.projectBlood
  },
  {
    id: 'project-hermes',
    title: 'Hermes',
    tagline: '一个智能助理',
    desc: '一个能跑腿的智能助理',
    tags: [{ label: 'AI', kind: 'ai' }, { label: '生产力', kind: 'prod' }],
    image: IMAGES.projectHermes
  }
]

/** `datetime` powers the semantic <time> element; `date` is the visible short form. */
export const NOTES = [
  { id: 'note-2026-09-05', date: '09.05', datetime: '2026-09-05', title: '最近一直在想的一些事' },
  { id: 'note-2026-08-20', date: '08.20', datetime: '2026-08-20', title: '关于长期主义的思考' },
  { id: 'note-2026-08-12', date: '08.12', datetime: '2026-08-12', title: '改变了我的工具' },
  { id: 'note-2026-07-28', date: '07.28', datetime: '2026-07-28', title: '更有意思的互联网' },
  { id: 'note-2026-07-11', date: '07.11', datetime: '2026-07-11', title: '在专业化世界里做一个通才' }
]

export const NOW_ITEMS = [
  { kind: 'read', emoji: '📖', label: '阅读', title: '纳瓦尔宝典' },
  { kind: 'make', emoji: '✏️', label: '创作中', title: '一些有意思的东西' },
  { kind: 'learn', emoji: '🎓', label: '学习', title: 'AI × 金融' },
  { kind: 'think', emoji: '💡', label: '思考', title: '一个更开放的未来' }
]

export const STATS = [
  { kind: 'a', emoji: '🌱', num: '12', label: '项目', sub: '做过的作品' },
  { kind: 'b', emoji: '📄', num: '86', label: '笔记', sub: '想法与写作' },
  { kind: 'c', emoji: '🧪', num: '7', label: '实验', sub: '进行中的点子' },
  { kind: 'd', emoji: '📷', num: '∞', label: '照片', sub: '值得记录的瞬间' }
]

export type LabItem = {
  id: string
  badge: 'LIVE' | 'BETA' | 'WIP'
  emoji: string
  title: string
  desc: string
  stack: string
}

export const LAB: LabItem[] = [
  { id: 'lab-ai-agent', badge: 'LIVE', emoji: '🤖', title: 'AI Agent Lab', desc: '让 Agent 帮我处理日常琐事，边用边写它的操作系统。', stack: 'Agents · Prompts · Tools' },
  { id: 'lab-finance', badge: 'BETA', emoji: '📊', title: 'Finance Automation', desc: '用脚本、爬虫、模型把资产管理里那些重复劳动全部外包给电脑。', stack: 'Python · APIs · Dashboards' },
  { id: 'lab-web', badge: 'WIP', emoji: '🧪', title: 'Web Experiments', desc: '试试 WebGL、动效、玻璃拟态、微交互——网页可以更好玩。', stack: 'Canvas · CSS · Motion' }
]

export type Photo =
  | { image: ImageAsset; cap: string; span2?: boolean; row2?: boolean }
  | { placeholder: string }

export const PHOTOS: Photo[] = [
  { image: { ...IMAGES.heroScene, alt: '深夜书桌：台灯、笔电与窗外的城市灯火' }, cap: 'Nightdesk · 2026', span2: true, row2: true },
  { image: { ...IMAGES.catSleep, alt: '一只猫在午后蜷着身体睡觉' }, cap: 'Nap Time' },
  { image: { ...IMAGES.nightCat, alt: '夜色中的城市天际线与一只猫的剪影' }, cap: 'City Glow' },
  { image: { ...IMAGES.catLaptop, alt: '猫趴在笔记本电脑旁边陪着工作' }, cap: 'Coworker' },
  { placeholder: '[ 待补充 · film scan ]' },
  { placeholder: '[ 待补充 · rooftop ]' },
  { placeholder: '[ 待补充 · street ]' }
]

// Search index consumed by the frontend (serialized into the page).
export const SEARCH_INDEX = [
  ...PROJECTS.map(p => ({ kind: 'project', icon: '🎨', title: p.title, desc: p.tagline, href: `#${p.id}` })),
  ...NOTES.map(n => ({ kind: 'note', icon: '📝', title: n.title, desc: n.date, href: `#${n.id}` })),
  ...LAB.map(l => ({ kind: 'lab', icon: '🧪', title: l.title, desc: l.stack, href: `#${l.id}` })),
  { kind: 'page', icon: '🌱', title: '近况', desc: '正在读、写、学、想什么', href: '#now' },
  { kind: 'page', icon: '📷', title: '照片', desc: '值得记录的瞬间', href: '#photos' },
  { kind: 'page', icon: '👋', title: '联系', desc: '打个招呼', href: '#contact' }
]
