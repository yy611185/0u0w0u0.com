import type { FC } from 'hono/jsx'
import { NAV_LINKS, SITE, IMAGES } from '../data'
import { Arrow, Picture, SearchIcon } from './shared'

export const Nav: FC = () => (
  <nav class="nav" id="site-nav" aria-label="主导航">
    <div class="nav-inner">
      <a href="#" class="nav-brand" aria-label="OuOwOuO 首页">{SITE.name}</a>

      <div class="nav-links" id="nav-links">
        {NAV_LINKS.map(l => <a href={l.href}>{l.label}</a>)}
      </div>

      <div class="nav-right">
        <button type="button" class="nav-search" id="search-open" aria-label="打开搜索 (Cmd/Ctrl+K)" aria-haspopup="dialog" data-search-open>
          <SearchIcon />
          <span class="kbd" aria-hidden="true">⌘K</span>
        </button>
        <a href="#contact" class="nav-cta" aria-label="联系我 — 打个招呼">
          <span aria-hidden="true">👋</span><span>打个招呼</span>
        </a>
        <button type="button" class="nav-hamburger" id="menu-toggle" aria-label="打开菜单" aria-expanded="false" aria-controls="mobile-menu" data-menu-toggle>
          <span class="bar" aria-hidden="true"></span>
          <span class="bar" aria-hidden="true"></span>
          <span class="bar" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </nav>
)

export const MobileDrawer: FC = () => (
  <>
    <div class="menu-backdrop" data-menu-backdrop aria-hidden="true" inert></div>
    <div class="mobile-menu" id="mobile-menu" role="dialog" aria-modal="false" aria-label="移动端导航" aria-hidden="true" inert>
      <ul>
        {NAV_LINKS.map(l => (
          <li><a href={l.href}>{l.label}<span class="arrow" aria-hidden="true">→</span></a></li>
        ))}
      </ul>
      <div class="mobile-menu-foot">
        <span>OuOwOuO · 数字花园</span>
        <span>ESC 关闭</span>
      </div>
    </div>
  </>
)

const GithubIcon = () => (
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
)
const MailIcon = () => (
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
)

export const Footer: FC = () => (
  <footer class="footer" id="contact" aria-labelledby="footer-brand">
    <div class="container footer-inner">
      <div class="footer-grid">
        <div>
          <p class="footer-brand" id="footer-brand">{SITE.name}</p>
          <p class="footer-tagline">
            互联网世界的一个好奇的人。<br />
            记录 · 分享 · 成长 — 一起看更大的世界。
          </p>
        </div>
        <div class="footer-cat" aria-hidden="true">
          <Picture image={IMAGES.catSleep} alt="" />
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-copyright">
          <strong>OuOwOuO.com</strong>
          <span>© 2026 OuOwOuO。保持好奇，继续前行。</span>
        </div>
        {(SITE.social.github || SITE.social.email) && (
          <ul class="footer-social">
            {SITE.social.github && <li><a class="social-btn" href={SITE.social.github} data-social="github" aria-label="GitHub（新窗口打开）" rel="me noopener noreferrer" target="_blank"><GithubIcon /></a></li>}
            {SITE.social.email && <li><a class="social-btn" href={SITE.social.email} data-social="email" aria-label="发送邮件"><MailIcon /></a></li>}
          </ul>
        )}
      </div>
    </div>
  </footer>
)

export const SearchModal: FC = () => (
  <div class="search-modal" id="search-modal" role="dialog" aria-modal="true" aria-label="站内搜索" aria-hidden="true" inert>
    <div class="backdrop" data-search-close aria-hidden="true"></div>
    <div class="search-panel">
      {/* Combobox pattern: the input keeps focus and points at the highlighted
          option through aria-activedescendant, which search.js maintains. */}
      <div class="search-inputbar">
        <SearchIcon />
        <input
          class="search-input"
          id="search-input"
          type="text"
          placeholder="搜索项目、笔记、实验……"
          aria-label="搜索项目、笔记与实验"
          autocomplete="off"
          role="combobox"
          aria-expanded="false"
          aria-controls="search-results"
          aria-autocomplete="list"
        />
        <button type="button" class="search-close" data-search-close aria-label="关闭搜索">ESC</button>
      </div>
      <div class="search-results" id="search-results" role="listbox" aria-label="搜索结果"></div>
      <div class="search-foot">
        <span><kbd>↑</kbd><kbd>↓</kbd> 选择 · <kbd>Enter</kbd> 打开</span>
        <span aria-hidden="true">OuOwOuO Search</span>
      </div>
    </div>
  </div>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
)

/**
 * Photo lightbox shell. The image/caption are filled in by lightbox.js from
 * whichever tile was activated, so no photo markup is duplicated here.
 */
export const Lightbox: FC = () => (
  <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="照片查看器" aria-hidden="true" inert>
    <div class="backdrop" data-lightbox-close aria-hidden="true"></div>

    <button type="button" class="lb-close" data-lightbox-close aria-label="关闭查看器 (Esc)"><CloseIcon /></button>
    <button type="button" class="lb-btn lb-prev" aria-label="上一张照片">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
    </button>
    <button type="button" class="lb-btn lb-next" aria-label="下一张照片">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
    </button>

    <figure class="lightbox-figure">
      <img id="lightbox-img" alt="" decoding="async" />
      <figcaption>
        <span id="lightbox-cap"></span>
        <span class="count" id="lightbox-count"></span>
      </figcaption>
    </figure>
  </div>
)
