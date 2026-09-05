import type { FC } from 'hono/jsx'
import { IMAGES, LAB, NOTES, NOW_ITEMS, PHOTOS, PROJECTS, STATS } from '../data'
import { Arrow, Card, Picture, SectionHead, TagList } from './shared'

/* ============ HERO ============ */
export const Hero: FC = () => (
  <section class="hero" id="hero" aria-label="欢迎">
    <div class="hero-inner">
      <div class="hero-text">
        <h1 class="hero-title"><span class="spark">OuOwOuO</span></h1>
        <p class="hero-subtitle">Yang 的数字花园</p>
        {/* A list of roles, marked up as one — the dots are pure decoration. */}
        <ul class="hero-tags">
          <li>学生</li><li class="dot" aria-hidden="true"></li>
          <li>创作者</li><li class="dot" aria-hidden="true"></li>
          <li>投资者</li><li class="dot" aria-hidden="true"></li>
          <li>好奇的人</li>
        </ul>
        <div class="hero-actions">
          <a href="#projects" class="btn btn-primary">开始探索 <Arrow /></a>
          <a href="#about" class="btn btn-ghost">关于我</a>
        </div>
      </div>
    </div>
    <div class="scroll-hint" aria-hidden="true">
      <div class="mouse"></div>
      <span>向下探索更多</span>
      <svg width="12" height="8" viewBox="0 0 12 8"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" /></svg>
    </div>
  </section>
)

/* ============ EXPLORE (Now / Projects / Notes / About / Stats) ============ */
const NowCard: FC = () => (
  <Card id="now">
    <div class="card-head">
      <h3 class="card-title"><span class="badge" aria-hidden="true">🌱</span>近况</h3>
      <span class="card-meta">一个正在成长的人</span>
    </div>
    <ul class="now-list">
      {NOW_ITEMS.map(n => (
        <li class="now-item">
          <span class={`now-icon ${n.kind}`} aria-hidden="true">{n.emoji}</span>
          <span class="now-label">{n.label}</span>
          <span class="now-title">{n.title}</span>
        </li>
      ))}
    </ul>
  </Card>
)

const ProjectsCard: FC = () => (
  <Card id="projects">
    <div class="card-head">
      <h3 class="card-title"><span class="badge" aria-hidden="true">🎨</span>精选项目</h3>
      <a class="card-link" href="#all-projects">查看全部 <Arrow /></a>
    </div>
    <div class="projects-row">
      {PROJECTS.map(p => (
        <a class="p-mini" href={`#${p.id}`} aria-label={`项目：${p.title} — ${p.tagline}`}>
          {/* Thumbnails render ~1/6 of their intrinsic width. */}
          <div class="p-mini-img"><Picture image={p.image} alt="" sizes="(max-width: 640px) 90vw, 180px" /></div>
          <div class="p-mini-body">
            <div class="p-mini-title">{p.title}</div>
            <div class="p-mini-desc">{p.tagline}</div>
            <TagList tags={p.tags} />
          </div>
        </a>
      ))}
    </div>
  </Card>
)

const NotesCard: FC = () => (
  <Card id="notes">
    <div class="card-head">
      <h3 class="card-title"><span class="badge" aria-hidden="true">📝</span>最新笔记</h3>
      <span class="card-meta">一路上的思考</span>
    </div>
    <div class="notes-list">
      {NOTES.map(n => (
        /* id makes the note reachable from the search palette. */
        <article class="note-item" id={n.id}>
          <time class="note-date" datetime={n.datetime}>{n.date}</time>
          <span class="note-title">{n.title}</span>
        </article>
      ))}
    </div>
  </Card>
)

export const Explore: FC = () => (
  <section class="section" id="explore" aria-labelledby="explore-title">
    <div class="container">
      <SectionHead eyebrow="Explore More" title="在这里，记录成长，探索可能" titleId="explore-title" sub="关于学习、创造和生活的点滴，构建属于我的数字花园。" />

      <div class="grid-3">
        <NowCard />
        <ProjectsCard />
        <NotesCard />
      </div>

      <div class="bottom-row">
        <Card id="about" class="quote-card">
          <div class="quote-thumb"><Picture image={IMAGES.heroScene} alt="" sizes="120px" /></div>
          <blockquote class="quote-body">
            <span class="quote-mark" aria-hidden="true">"</span>
            <p class="quote-text">好奇头脑，<br />能建造更明亮的明天。</p>
            <footer class="quote-author">— OuOwOuO</footer>
          </blockquote>
        </Card>

        <Card class="stats-card">
          {STATS.map(s => (
            <div class="stat">
              <span class={`stat-icon ${s.kind}`} aria-hidden="true">{s.emoji}</span>
              <div>
                <div class="stat-num">{s.num}</div>
                <div class="stat-label">{s.label}</div>
                <div class="stat-sub">{s.sub}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  </section>
)

/* ============ LAB ============ */
export const Lab: FC = () => (
  <section class="section" id="lab" aria-labelledby="lab-title">
    <div class="container">
      <SectionHead eyebrow="The Lab" title="实验室 — 正在孵化的点子" titleId="lab-title" sub="一些尚未成型但值得动手尝试的探索：AI、自动化、金融与 Web。" />
      <div class="lab-grid">
        {LAB.map(l => (
          <article class="card lab-card" id={l.id}>
            <span class={`lab-badge ${l.badge.toLowerCase()}`}>{l.badge}</span>
            <span class="lab-emoji" aria-hidden="true">{l.emoji}</span>
            <h3 class="lab-title">{l.title}</h3>
            <p class="lab-desc">{l.desc}</p>
            <div class="lab-foot">
              <span>{l.stack}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
)

/* ============ PHOTOS ============ */
export const Photos: FC = () => (
  <section class="section" id="photos" aria-labelledby="photos-title">
    <div class="container">
      <SectionHead eyebrow="Photo Wall" title="照片 — 值得记录的瞬间" titleId="photos-title" sub="生活的碎片。城市、深夜、光线，和一只猫。" />
      {/* The first tile spans 2×2, so it needs a much larger rendered size
          than the rest — hence the per-tile `sizes` hint. */}
      <div class="photo-grid">
        {PHOTOS.map((p, i) =>
          'placeholder' in p ? null : (
            <figure class={`photo ${p.span2 ? 'span-2' : ''} ${p.row2 ? 'row-2' : ''}`.trim()}>
              <Picture
                image={p.image}
                sizes={i === 0 ? '(max-width: 640px) 92vw, 580px' : '(max-width: 640px) 46vw, 290px'}
              />
              <figcaption class="cap">{p.cap}</figcaption>
            </figure>
          )
        )}
      </div>
    </div>
  </section>
)

/* ============ ALL PROJECTS ============ */
export const AllProjects: FC = () => (
  <section class="section" id="all-projects" aria-labelledby="ap-title">
    <div class="container">
      <SectionHead eyebrow="All Projects" title="全部项目" titleId="ap-title" sub="在正式项目详情页上线之前，这里先集中呈现。" />
      <div class="ap-grid">
        {PROJECTS.map(p => (
          <article class="ap-card" id={p.id}>
            <div class="p-mini-img"><Picture image={p.image} alt="" sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 380px" /></div>
            <div class="p-mini-body">
              <div class="p-mini-title">{p.title}</div>
              <div class="p-mini-desc">{p.desc}</div>
              <TagList tags={p.tags} />
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
)
