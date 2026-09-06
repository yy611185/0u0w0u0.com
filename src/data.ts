// Central content config — all copy comes from the design handoff (final Chinese copy).

export type SocialLinks = {
  github?: string
  x?: string
  email?: string
}

type SiteConfig = {
  name: string
  title: string
  description: string
  url: string
  social: SocialLinks
}

export const SITE: SiteConfig = {
  name: 'OuOwOuO',
  title: 'OuOwOuO — Yang 的数字花园',
  description: 'OuOwOuO — Yang 的数字花园，记录学习、创造、项目与生活。',
  url: 'https://ouowouo.com/',
  social: {
    github: 'https://github.com/yy611185',
    email: 'mailto:yy050202@outlook.com'
  }
}

export const NAV_LINKS = [
  { href: '/about', label: '关于' },
  { href: '/projects', label: '项目' },
  { href: '/notes', label: '笔记' },
  { href: '/lab', label: '实验室' },
  { href: '/now', label: '近况' },
  { href: '/photos', label: '照片' },
  { href: '/#contact', label: '联系' }
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

export const NOW_ITEMS = [
  { kind: 'read', emoji: '📖', label: '阅读', title: '纳瓦尔宝典' },
  { kind: 'make', emoji: '✏️', label: '创作中', title: '一些有意思的东西' },
  { kind: 'learn', emoji: '🎓', label: '学习', title: 'AI × 金融' },
  { kind: 'think', emoji: '💡', label: '思考', title: '一个更开放的未来' }
]

export const STATS = [
  { kind: 'a', emoji: '🌱', num: '3', label: '项目', sub: '做过的作品' },
  { kind: 'b', emoji: '📄', num: '5', label: '笔记', sub: '想法与写作' },
  { kind: 'c', emoji: '🧪', num: '3', label: '实验', sub: '进行中的点子' },
  { kind: 'd', emoji: '📷', num: '∞', label: '照片', sub: '值得记录的瞬间' }
]

export type Photo = { image: ImageAsset; cap: string; span2?: boolean; row2?: boolean }

export const PHOTOS: Photo[] = [
  {
    image: { ...IMAGES.heroScene, alt: '深夜书桌：台灯、笔电与窗外的城市灯火' },
    cap: 'Nightdesk · 2026',
    span2: true,
    row2: true
  },
  { image: { ...IMAGES.catSleep, alt: '一只猫在午后蜷着身体睡觉' }, cap: 'Nap Time' },
  { image: { ...IMAGES.nightCat, alt: '夜色中的城市天际线与一只猫的剪影' }, cap: 'City Glow' },
  { image: { ...IMAGES.catLaptop, alt: '猫趴在笔记本电脑旁边陪着工作' }, cap: 'Coworker' }
]
