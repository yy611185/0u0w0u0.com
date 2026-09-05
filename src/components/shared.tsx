import type { FC, PropsWithChildren } from 'hono/jsx'
import type { ImageAsset, Tag } from '../data'

/**
 * <picture> with a WebP primary source and a PNG/JPG fallback.
 *
 * `width`/`height` are always emitted so the browser can reserve the box
 * before the bytes arrive (CLS = 0); CSS still controls the rendered size.
 * `priority` marks the one above-the-fold image: eager + high fetchpriority.
 */
export const Picture: FC<{
  image: ImageAsset
  alt?: string
  lazy?: boolean
  priority?: boolean
  sizes?: string
}> = ({ image, alt, lazy = true, priority = false, sizes }) => (
  <picture>
    <source srcset={image.webp} type="image/webp" sizes={sizes} />
    <img
      src={image.fallback}
      alt={alt ?? image.alt}
      width={image.w}
      height={image.h}
      sizes={sizes}
      loading={priority ? 'eager' : lazy ? 'lazy' : undefined}
      fetchpriority={priority ? 'high' : undefined}
      decoding={priority ? 'sync' : 'async'}
    />
  </picture>
)

export const SectionHead: FC<{ eyebrow: string; title: string; titleId: string; sub: string }> = ({
  eyebrow,
  title,
  titleId,
  sub
}) => (
  <header class="section-head">
    <p class="eyebrow">{eyebrow}</p>
    <h2 class="section-title" id={titleId}>{title}</h2>
    <p class="section-sub">{sub}</p>
  </header>
)

export const TagList: FC<{ tags: Tag[] }> = ({ tags }) => (
  <ul class="p-mini-tags">
    {tags.map(t => <li class={`tag ${t.kind}`}>{t.label}</li>)}
  </ul>
)

export const SearchIcon: FC = () => (
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)

/** Decorative arrow that slides on hover — animated by CSS, never by JS. */
export const Arrow: FC<{ char?: string }> = ({ char = '→' }) => (
  <span class="btn-arrow" aria-hidden="true">{char}</span>
)

export const Card: FC<PropsWithChildren<{ id?: string; class?: string }>> = ({ id, class: cls, children }) => (
  <div class={`card ${cls ?? ''}`.trim()} id={id}>{children}</div>
)
