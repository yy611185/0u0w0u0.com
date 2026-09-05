import type { FC, PropsWithChildren } from 'hono/jsx'
import type { ImageAsset, Tag } from '../data'

/** <picture> with WebP primary source and PNG/JPG fallback */
export const Picture: FC<{ image: ImageAsset; alt?: string; lazy?: boolean }> = ({ image, alt, lazy = true }) => (
  <picture>
    <source srcset={image.webp} type="image/webp" />
    <img src={image.fallback} alt={alt ?? image.alt} loading={lazy ? 'lazy' : undefined} decoding="async" />
  </picture>
)

export const SectionHead: FC<{ eyebrow: string; title: string; titleId: string; sub: string }> = ({ eyebrow, title, titleId, sub }) => (
  <header class="section-head">
    <p class="eyebrow">{eyebrow}</p>
    <h2 class="section-title" id={titleId}>{title}</h2>
    <p class="section-sub">{sub}</p>
  </header>
)

export const TagList: FC<{ tags: Tag[] }> = ({ tags }) => (
  <div class="p-mini-tags">
    {tags.map(t => <span class={`tag ${t.kind}`}>{t.label}</span>)}
  </div>
)

export const SearchIcon: FC = () => (
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)

export const Card: FC<PropsWithChildren<{ id?: string; class?: string }>> = ({ id, class: cls, children }) => (
  <div class={`card ${cls ?? ''}`.trim()} id={id}>{children}</div>
)
