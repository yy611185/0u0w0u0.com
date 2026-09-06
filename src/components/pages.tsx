import type { FC } from 'hono/jsx'
import { raw } from 'hono/html'
import { useRequestContext } from 'hono/jsx-renderer'
import type { LabItem, Note, Project } from '../content'
import { IMAGES, NOW_ITEMS, NOW_META, PHOTOS } from '../data'
import { Arrow, Picture, TagList } from './shared'

const zhDate = (date: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${date}T00:00:00Z`))

export const PageHero: FC<{ eyebrow: string; title: string; description: string }> = ({
  eyebrow,
  title,
  description
}) => (
  <header class="page-hero container" data-load>
    <p class="eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    <p>{description}</p>
  </header>
)

const DraftBadge: FC<{ draft: boolean }> = ({ draft }) =>
  draft ? <span class="draft-badge">DRAFT · 仅开发环境</span> : null

export const NotesIndex: FC<{ notes: Note[] }> = ({ notes }) => (
  <>
    <PageHero
      eyebrow="Field Notes"
      title="笔记"
      description="一路上的想法、学习与写作。这里不是答案仓库，更像一张持续生长的思维地图。"
    />
    <section class="index-section container" aria-labelledby="latest-note">
      {notes[0] && (
        <a class="featured-note" href={`/notes/${notes[0].slug}`}>
          <div>
            <span class="index-kicker">最新笔记</span>
            <h2 id="latest-note">{notes[0].title}</h2>
            <p>{notes[0].description}</p>
          </div>
          <div class="featured-note-meta">
            <DraftBadge draft={notes[0].draft} />
            <time datetime={notes[0].date}>{zhDate(notes[0].date)}</time>
            <span>{notes[0].readingTime} 分钟阅读</span>
            <Arrow />
          </div>
        </a>
      )}
      <div class="content-list-head">
        <h2>全部笔记</h2>
        <span>{notes.length} 篇</span>
      </div>
      <div class="content-list">
        {notes.map((note) => (
          <a class="content-row" href={`/notes/${note.slug}`}>
            <time datetime={note.date}>{note.date}</time>
            <div>
              <h3>{note.title}</h3>
              <p>{note.description}</p>
              <TagList tags={note.tags} />
            </div>
            <DraftBadge draft={note.draft} />
            <Arrow />
          </a>
        ))}
      </div>
    </section>
  </>
)

export const NoteDetail: FC<{ note: Note; previous?: Note; next?: Note }> = ({
  note,
  previous,
  next
}) => (
  <article class="article-page">
    <header class="article-header container" data-load>
      <a class="back-link" href="/notes">
        ← 返回笔记
      </a>
      <DraftBadge draft={note.draft} />
      <h1>{note.title}</h1>
      <p class="article-lead">{note.description}</p>
      <div class="article-meta">
        <time datetime={note.date}>发布于 {zhDate(note.date)}</time>
        {note.updated !== note.date && (
          <time datetime={note.updated}>更新于 {zhDate(note.updated)}</time>
        )}
        <span>{note.readingTime} 分钟阅读</span>
      </div>
      <TagList tags={note.tags} />
    </header>
    <div class="prose" dangerouslySetInnerHTML={{ __html: note.content }}></div>
    <nav class="article-pager container" aria-label="笔记翻页">
      {previous ? (
        <a href={`/notes/${previous.slug}`}>
          <span>上一篇</span>
          <strong>{previous.title}</strong>
        </a>
      ) : (
        <span></span>
      )}
      {next ? (
        <a href={`/notes/${next.slug}`} class="next">
          <span>下一篇</span>
          <strong>{next.title}</strong>
        </a>
      ) : (
        <span></span>
      )}
    </nav>
  </article>
)

export const ProjectsIndex: FC<{ projects: Project[] }> = ({ projects }) => (
  <>
    <PageHero
      eyebrow="Selected Work"
      title="项目"
      description="一些已经走过完整路径的作品：从真实问题、反复取舍，到今天仍在继续的版本。"
    />
    <section class="project-index container" aria-label="全部项目">
      {projects.map((project, i) => (
        <a class="project-index-card" href={`/projects/${project.slug}`} data-reveal>
          <div class="project-index-cover">
            <Picture
              image={project.cover}
              alt={`${project.title} 项目预览`}
              sizes="(max-width: 700px) 92vw, 560px"
            />
          </div>
          <div class="project-index-copy">
            <div class="project-index-top">
              <span>0{i + 1}</span>
              <span class={`project-status ${project.status}`}>{project.status}</span>
            </div>
            <h2>{project.title}</h2>
            <p class="project-tagline">{project.tagline}</p>
            <p>{project.description}</p>
            <TagList tags={project.tags} />
            <span class="project-open">
              查看项目 <Arrow />
            </span>
          </div>
        </a>
      ))}
    </section>
  </>
)

export const ProjectDetail: FC<{ project: Project; related: Project[] }> = ({
  project,
  related
}) => (
  <article class="project-page">
    <header class="project-hero container" data-load>
      <div class="project-hero-copy">
        <a class="back-link" href="/projects">
          ← 返回项目
        </a>
        <DraftBadge draft={project.draft} />
        <p class="eyebrow">Project · {project.status}</p>
        <h1>{project.title}</h1>
        <p class="project-hero-tagline">{project.tagline}</p>
        <p>{project.description}</p>
        <TagList tags={project.tags} />
        <div class="project-actions">
          {project.repository && (
            <a
              class="btn btn-primary"
              href={project.repository}
              target="_blank"
              rel="noopener noreferrer"
            >
              Repository <Arrow />
            </a>
          )}
          {project.demo && (
            <a class="btn btn-ghost" href={project.demo} target="_blank" rel="noopener noreferrer">
              Live Demo <Arrow />
            </a>
          )}
        </div>
      </div>
      <div class="project-hero-image">
        <Picture
          image={project.cover}
          alt={`${project.title} 项目场景`}
          priority
          sizes="(max-width: 800px) 92vw, 560px"
        />
      </div>
    </header>
    <div class="project-detail-grid container">
      <aside class="project-facts">
        <div>
          <span>时间</span>
          <strong>
            {project.date.slice(0, 4)} —{' '}
            {project.status === 'active' ? '现在' : project.updated.slice(0, 4)}
          </strong>
        </div>
        <div>
          <span>状态</span>
          <strong>{project.status}</strong>
        </div>
        <div>
          <span>技术</span>
          <strong>{project.stack.join(' · ')}</strong>
        </div>
      </aside>
      <div class="prose project-prose" dangerouslySetInnerHTML={{ __html: project.content }}></div>
    </div>
    {related.length > 0 && (
      <section class="related container">
        <p class="eyebrow">Keep Exploring</p>
        <h2>相关项目</h2>
        <div>
          {related.map((item) => (
            <a href={`/projects/${item.slug}`}>
              <strong>{item.title}</strong>
              <span>{item.tagline}</span>
              <Arrow />
            </a>
          ))}
        </div>
      </section>
    )}
  </article>
)

export const LabIndex: FC<{ items: LabItem[] }> = ({ items }) => (
  <>
    <PageHero
      eyebrow="The Lab"
      title="实验室"
      description="还在冒泡的点子、WIP 与原型。这里允许不完整，也诚实记录失败和下一次尝试。"
    />
    <section class="lab-index container" aria-label="全部实验">
      {items.map((item) => (
        <a class="lab-index-card" href={`/lab/${item.slug}`}>
          <span class={`lab-badge ${item.status.toLowerCase()}`}>{item.status}</span>
          <span class="lab-index-emoji" aria-hidden="true">
            {item.emoji}
          </span>
          <h2>{item.title}</h2>
          <p>{item.description}</p>
          <span class="lab-stack">{item.stack.join(' · ')}</span>
          <span class="lab-open">
            打开实验记录 <Arrow />
          </span>
        </a>
      ))}
    </section>
  </>
)

export const LabDetail: FC<{ item: LabItem }> = ({ item }) => (
  <article class="article-page lab-detail">
    <header class="article-header container" data-load>
      <a class="back-link" href="/lab">
        ← 返回实验室
      </a>
      <span class="lab-detail-emoji" aria-hidden="true">
        {item.emoji}
      </span>
      <span class={`lab-badge ${item.status.toLowerCase()}`}>{item.status}</span>
      <DraftBadge draft={item.draft} />
      <h1>{item.title}</h1>
      <p class="article-lead">{item.description}</p>
      <div class="article-meta">
        <time datetime={item.updated}>最后更新 {zhDate(item.updated)}</time>
        <span>{item.stack.join(' · ')}</span>
      </div>
    </header>
    <div class="prose" dangerouslySetInnerHTML={{ __html: item.content }}></div>
  </article>
)

export const NowPage: FC = () => (
  <>
    <PageHero
      eyebrow={`Now / ${NOW_META.label}`}
      title="此刻，正在发生的事"
      description="一张不追求完整的近况快照。它会随着注意力、季节和手边的问题一起改变。"
    />
    <section class="now-page container">
      {NOW_ITEMS.map((item) => (
        <article>
          <span class={`now-icon ${item.kind}`} aria-hidden="true">
            {item.emoji}
          </span>
          <p>{item.label}</p>
          <h2>{item.title}</h2>
          {item.kind === 'read' && <span>在别人的经验里寻找更长的时间尺度。</span>}
          {item.kind === 'make' && <span>把模糊想法做成可以被看见、被使用的东西。</span>}
          {item.kind === 'learn' && <span>理解工具如何改变研究、决策与创造。</span>}
          {item.kind === 'think' && <span>互联网还可以有哪些更开放、更有人情味的形态？</span>}
        </article>
      ))}
    </section>
    <p class="updated-note container">
      最后更新于 <time datetime={NOW_META.updated}>{NOW_META.updatedDisplay}</time> · 灵感来自 Derek
      Sivers 的{' '}
      <a href="https://nownownow.com/about" rel="noopener noreferrer" target="_blank">
        /now movement
      </a>
      。
    </p>
  </>
)

export const AboutPage: FC = () => (
  <>
    <PageHero
      eyebrow="About Yang"
      title="保持好奇，然后动手"
      description="我是 Yang，一个在学习、技术、金融和创造之间来回探索的人。OuOwOuO 是我在互联网上留的一盏灯。"
    />
    <section class="about-page container">
      <div class="about-portrait">
        <Picture
          image={IMAGES.catLaptop}
          alt="一只趴在笔记本电脑旁的黑猫"
          sizes="(max-width: 700px) 82vw, 420px"
        />
      </div>
      <div class="about-copy prose">
        <h2>关于这个名字</h2>
        <p>
          OuOwOuO
          看起来像一只盯着屏幕的猫，也像某种没有标准答案的表情。这个名字提醒我：互联网不只能高效和严肃，它也可以保留一点奇怪、柔软与个人趣味。
        </p>
        <h2>我在做什么</h2>
        <p>
          我用代码做工具，用写作整理思考，也持续学习投资与
          AI。项目页放相对成熟的作品，实验室记录尚未成型的原型，笔记则保存途中改变过我的问题。
        </p>
        <blockquote>我想建造的不是一份在线简历，而是一处会随着我一起生长的空间。</blockquote>
        <h2>一起聊聊</h2>
        <p>
          如果你也在做有意思的东西，或者只是想交换一条最近学到的事，欢迎{' '}
          <a href="mailto:yy050202@outlook.com">写封邮件</a>。
        </p>
      </div>
    </section>
  </>
)

export const PhotosPage: FC = () => (
  <>
    <PageHero
      eyebrow="Photo Wall"
      title="照片"
      description="生活的碎片。城市、深夜、光线，和一只总在附近的猫。点击照片可以放大查看。"
    />
    <section class="photos-page container">
      <div class="photo-grid">
        {PHOTOS.map((photo, i) => (
          <figure
            class={`photo ${photo.span2 ? 'span-2' : ''} ${photo.row2 ? 'row-2' : ''}`.trim()}
          >
            <Picture
              image={photo.image}
              sizes={i === 0 ? '(max-width: 640px) 92vw, 580px' : '(max-width: 640px) 46vw, 290px'}
            />
            <figcaption class="cap">{photo.cap}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  </>
)

export const NotFoundPage: FC = () => (
  <section class="not-found container">
    <div>
      <span class="not-found-code">404</span>
      <h1>这里好像什么都没有。</h1>
      <p>也许这个角落还没种下内容，或者链接已经悄悄搬家了。</p>
      <div>
        <a class="btn btn-primary" href="/">
          返回首页 <Arrow />
        </a>
        <button class="btn btn-ghost" type="button" data-search-open>
          搜索本站
        </button>
      </div>
    </div>
    <Picture image={IMAGES.catSleep} alt="一只睡着的猫" sizes="320px" />
  </section>
)

export const ErrorPage: FC = () => (
  <section class="not-found container">
    <div>
      <span class="not-found-code">500</span>
      <h1>这个角落暂时没能打开。</h1>
      <p>服务器遇到了一点问题。请稍后重试，或先返回首页继续探索。</p>
      <div>
        <a class="btn btn-primary" href="/">
          返回首页 <Arrow />
        </a>
      </div>
    </div>
    <Picture image={IMAGES.catLaptop} alt="一只守在笔记本电脑旁的猫" sizes="320px" />
  </section>
)

export const JsonLd: FC<{ value: unknown }> = ({ value }) => {
  const nonce = useRequestContext().get('cspNonce')
  return (
    <script nonce={nonce} type="application/ld+json">
      {raw(JSON.stringify(value).replace(/</g, '\\u003c'))}
    </script>
  )
}
