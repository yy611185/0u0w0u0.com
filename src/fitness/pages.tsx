import type { Child } from 'hono/jsx'
import type { Exercise, FitnessData, Session } from './types'
import { rollingWeights, summary, today } from './metrics'
import { progression } from './analysis'

const navigation = [
  ['dashboard', '概览'],
  ['workout', '今日训练'],
  ['plan', '训练计划'],
  ['exercises', '动作库'],
  ['history', '训练历史'],
  ['progress', '身体进度'],
  ['achievements', '成就']
] as const

const number = (value: number) => Number(value.toFixed(1)).toString()
const dateLabel = (date: string, timezone: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric'
  }).format(new Date(date.length === 10 ? `${date}T12:00:00Z` : date))
const completedSessions = (data: FitnessData) =>
  data.sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => (b.finishedAt || b.startedAt).localeCompare(a.finishedAt || a.startedAt))
const setDescription = (set: FitnessData['sets'][number]) =>
  set.durationSeconds
    ? `${number(set.durationSeconds / 60)} 分钟 · RPE ${set.rpe}`
    : `${number(set.weight)} kg × ${set.reps} · RPE ${set.rpe}`

function Heading({
  eyebrow,
  title,
  children
}: {
  eyebrow: string
  title: string
  children?: Child
}) {
  return (
    <header class="fit-heading">
      <p class="fit-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children && <p class="fit-muted">{children}</p>}
    </header>
  )
}

function Empty({ title, children }: { title: string; children: Child }) {
  return (
    <div class="fit-empty">
      <span class="fit-empty-mark" aria-hidden="true">
        ↗
      </span>
      <h3>{title}</h3>
      <p class="fit-muted">{children}</p>
    </div>
  )
}

function Stat({
  label,
  value,
  unit,
  detail
}: {
  label: string
  value: string | number
  unit?: string
  detail?: string
}) {
  return (
    <div class="fit-card fit-stat">
      <p class="fit-muted">{label}</p>
      <strong>
        {value}
        <span>{unit}</span>
      </strong>
      {detail && <p class="fit-caption">{detail}</p>}
    </div>
  )
}

function Dashboard({ data }: { data: FitnessData }) {
  const stats = summary(data)
  const day = stats.nextDay
  const plan = data.plan.filter((item) => item.dayId === day?.id)
  const active = data.sessions.find((session) => session.status === 'active')
  const recent = completedSessions(data).slice(0, 3)
  const monthPercent = Math.round((stats.monthCount / data.profile.monthlyTarget) * 100)
  return (
    <>
      <Heading eyebrow="PERSONAL FITNESS / OVERVIEW" title="让每一次训练，都算数。">
        循环前进，稳稳积累。今天从这里开始。
      </Heading>
      {stats.daysSince !== null && stats.daysSince >= 7 && (
        <aside class="fit-notice">
          距离上次训练已过 {stats.daysSince} 天。你的记录一直都在，从下一次继续。
        </aside>
      )}
      <section class="fit-today fit-card" aria-labelledby="fit-next-title">
        <div class="fit-today-copy">
          <p class="fit-eyebrow">{active ? '训练进行中' : '下一次训练'}</p>
          <h2 id="fit-next-title">
            {active ? data.days.find((d) => d.id === active.dayId)?.name : day?.name}
          </h2>
          <p>{active ? data.days.find((d) => d.id === active.dayId)?.focus : day?.focus}</p>
          <div class="fit-tags">
            <span>45–60 分钟</span>
            <span>{plan.length} 个动作</span>
            <span>A → B → C → D</span>
          </div>
          <a class="fit-button" href="/fitness/workout">
            {active ? '继续训练' : '准备开始训练'}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div class="fit-today-side">
          <span class="fit-day-letter" aria-hidden="true">
            {(active?.dayId || day?.id || 'A').replace(/^day[-_]?/i, '').toUpperCase()}
          </span>
          <p>
            每周至少 {data.profile.weeklyMinimum} 次<br />
            理想节奏 {data.profile.weeklyIdeal} 次
          </p>
        </div>
      </section>
      <section class="fit-grid fit-grid-4" aria-label="训练概览">
        <Stat
          label="本周训练"
          value={stats.weekCount}
          unit={`/ ${data.profile.weeklyMinimum} 次`}
          detail={`理想目标 ${data.profile.weeklyIdeal} 次 / 周`}
        />
        <Stat label="连续达标" value={stats.streak} unit="周" detail="每周完成最低训练目标" />
        <Stat
          label="本月完成率"
          value={monthPercent}
          unit="%"
          detail={`${stats.monthCount} / ${data.profile.monthlyTarget} 次训练`}
        />
        <Stat
          label="累计训练"
          value={stats.total}
          unit="次"
          detail={
            stats.lastDate
              ? `最近训练 ${dateLabel(stats.lastDate, data.profile.timezone)}`
              : '从第一场训练开始'
          }
        />
      </section>
      <section class="fit-card">
        <div class="fit-section-head">
          <h2>最近的积累</h2>
          <a class="fit-text-link" href="/fitness/history">
            全部历史 ↗
          </a>
        </div>
        {recent.length ? (
          recent.map((session) => <SessionRow data={data} session={session} />)
        ) : (
          <Empty title="你的第一笔训练，还在前面。">
            完成一场训练后，动作、组数和表现会保存在这里。
          </Empty>
        )}
      </section>
      <aside class="fit-recovery">
        <span class="fit-eyebrow">找回节奏</span>
        <p>恢复训练前两周保持 RPE 6–7，约留 3 次余力。第三周起再逐步提高至 RPE 7–8。</p>
      </aside>
    </>
  )
}

function Plan({ data }: { data: FitnessData }) {
  return (
    <>
      <Heading eyebrow="YOUR TRAINING CYCLE" title="四个训练日，一个长期节奏。">
        A → B → C → D 循环推进，跨周接着练。目标调整由你确认后生效。
      </Heading>
      <div class="fit-plan-jump">
        {data.days.map((day) => (
          <a href={`#${day.id}`} class="fit-chip">
            {day.name}
          </a>
        ))}
      </div>
      {data.days.map((day) => (
        <section class="fit-card fit-plan-day" id={day.id}>
          <div class="fit-section-head">
            <div>
              <p class="fit-eyebrow">TRAINING DAY {day.id}</p>
              <h2>{day.name}</h2>
              <p class="fit-muted">{day.focus}</p>
            </div>
            <span class="fit-chip">45–60 分钟</span>
          </div>
          {data.plan
            .filter((item) => item.dayId === day.id)
            .sort((a, b) => a.position - b.position)
            .map((item) => {
              const exercise = data.exercises.find((exercise) => exercise.id === item.exerciseId)
              const suggestion = progression(data, item)
              return (
                <div class="fit-plan-row">
                  <span class="fit-index">{String(item.position + 1).padStart(2, '0')}</span>
                  <div class="fit-plan-info">
                    <a href={`/fitness/exercises/${item.exerciseId}`}>
                      <h3>
                        {exercise?.nameZh || item.exerciseId}
                        {Boolean(item.optional) && <span class="fit-optional">可选</span>}
                      </h3>
                    </a>
                    <p class="fit-muted">{exercise?.nameEn}</p>
                    <p>
                      {item.durationSeconds
                        ? `${number(item.durationSeconds / 60)} 分钟`
                        : `${item.sets} 组${item.repsMax ? ` × ${item.repsMin}–${item.repsMax} 次` : ' · 按实际次数'}`}
                      {item.targetWeight !== null && ` · ${number(item.targetWeight)} kg`}
                    </p>
                    {item.note && <p class="fit-caption">{item.note}</p>}
                  </div>
                  {suggestion && (
                    <form class="fit-suggestion" method="post" action="/fitness/api/suggestion">
                      <input type="hidden" name="planExerciseId" value={item.id} />
                      <input type="hidden" name="sessionId" value={suggestion.sessionId} />
                      <input type="hidden" name="targetWeight" value={suggestion.targetWeight} />
                      <p>{suggestion.reason}</p>
                      <button class="fit-button fit-button-secondary" type="submit">
                        确认尝试 {suggestion.targetWeight} kg
                      </button>
                    </form>
                  )}
                  {!item.durationSeconds && (
                    <details class="fit-target">
                      <summary>调整目标</summary>
                      <form method="post" action="/fitness/api/target">
                        <input type="hidden" name="planExerciseId" value={item.id} />
                        <div class="fit-fields">
                          <label>
                            重量 kg
                            <input
                              type="number"
                              name="targetWeight"
                              min="0"
                              max="500"
                              step="0.25"
                              inputmode="decimal"
                              value={item.targetWeight ?? ''}
                              placeholder="待确定"
                            />
                          </label>
                          <label>
                            组数
                            <input
                              type="number"
                              name="sets"
                              min="1"
                              max="10"
                              required
                              value={item.sets}
                              inputmode="numeric"
                            />
                          </label>
                          <label>
                            最低次数
                            <input
                              type="number"
                              name="repsMin"
                              min="0"
                              max="200"
                              required
                              value={item.repsMin}
                              inputmode="numeric"
                            />
                          </label>
                          <label>
                            最高次数
                            <input
                              type="number"
                              name="repsMax"
                              min="0"
                              max="200"
                              required
                              value={item.repsMax}
                              inputmode="numeric"
                            />
                          </label>
                        </div>
                        <button class="fit-button" type="submit">
                          确认下一次目标
                        </button>
                      </form>
                    </details>
                  )}
                </div>
              )
            })}
        </section>
      ))}
      <aside class="fit-recovery">
        <p>
          进阶原则：全部目标组达到次数上限且 RPE ≤ 8
          时，可以考虑小幅加重。任何建议都需要你确认，进行中的训练保留开始时的目标。
        </p>
      </aside>
    </>
  )
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <a class="fit-card fit-exercise-card" href={`/fitness/exercises/${exercise.id}`}>
      <div class="fit-exercise-image">
        {exercise.mediaUrl ? (
          <img
            src={exercise.mediaUrl}
            alt={`${exercise.nameZh}动作示意`}
            loading="lazy"
            decoding="async"
            width="420"
            height="300"
          />
        ) : (
          <span class="fit-muted">暂无动作图片</span>
        )}
      </div>
      <div class="fit-exercise-copy">
        <p class="fit-eyebrow">
          {exercise.primaryMuscle} / {exercise.difficulty}
        </p>
        <h2>{exercise.nameZh}</h2>
        <p class="fit-muted">{exercise.nameEn}</p>
        <p class="fit-caption">{exercise.equipment.join(' · ')}</p>
      </div>
      <span class="fit-card-arrow" aria-hidden="true">
        ↗
      </span>
    </a>
  )
}

function Exercises({ data, filters }: { data: FitnessData; filters: Record<string, string> }) {
  const dimensions: { name: string; label: string; values: string[] }[] = [
    { name: 'muscle', label: '身体部位', values: data.exercises.map((e) => e.primaryMuscle) },
    { name: 'equipment', label: '器械', values: data.exercises.flatMap((e) => e.equipment) },
    { name: 'difficulty', label: '难度', values: data.exercises.map((e) => e.difficulty) },
    { name: 'location', label: '训练场地', values: data.exercises.flatMap((e) => e.locations) },
    { name: 'type', label: '动作类型', values: data.exercises.map((e) => e.type) }
  ]
  const matches = data.exercises.filter(
    (exercise) =>
      (!filters.q ||
        `${exercise.nameZh} ${exercise.nameEn}`.toLowerCase().includes(filters.q.toLowerCase())) &&
      (!filters.muscle || exercise.primaryMuscle === filters.muscle) &&
      (!filters.equipment || exercise.equipment.includes(filters.equipment)) &&
      (!filters.difficulty || exercise.difficulty === filters.difficulty) &&
      (!filters.location || exercise.locations.includes(filters.location)) &&
      (!filters.type || exercise.type === filters.type)
  )
  return (
    <>
      <Heading eyebrow="MOVEMENT LIBRARY" title="把动作练熟，把训练变简单。">
        当前计划与常见替代动作。先看要点，再开始记录。
      </Heading>
      <form class="fit-card fit-filters" method="get" action="/fitness/exercises">
        <label class="fit-search">
          搜索动作
          <input type="search" name="q" value={filters.q || ''} placeholder="中文或英文动作名称" />
        </label>
        <div class="fit-filter-selects">
          {dimensions.map((dimension) => (
            <label>
              {dimension.label}
              <select name={dimension.name}>
                <option value="">全部{dimension.label}</option>
                {[...new Set(dimension.values)].sort().map((value) => (
                  <option value={value} selected={filters[dimension.name] === value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div class="fit-filter-actions">
          <button class="fit-button" type="submit">
            筛选动作
          </button>
          <a class="fit-text-link" href="/fitness/exercises">
            重置
          </a>
          <span class="fit-muted">
            {matches.length} / {data.exercises.length} 个动作
          </span>
        </div>
      </form>
      {matches.length ? (
        <section class="fit-grid fit-grid-3" aria-label="筛选结果">
          {matches.map((exercise) => (
            <ExerciseCard exercise={exercise} />
          ))}
        </section>
      ) : (
        <div class="fit-card">
          <Empty title="没有符合条件的动作">试着减少一个筛选条件，或使用更短的动作名称。</Empty>
        </div>
      )}
    </>
  )
}

function MuscleMap({ exercise }: { exercise: Exercise }) {
  const target = exercise.primaryMuscle
  const region = /胸/.test(target)
    ? 'chest'
    : /肩|三角/.test(target)
      ? 'shoulder'
      : /腹|核心|腰/.test(target)
        ? 'core'
        : /背|斜方/.test(target)
          ? 'back'
          : /臀/.test(target)
            ? 'glute'
            : /小腿|腓肠|比目/.test(target)
              ? 'calf'
              : /腿|股|腘绳/.test(target)
                ? 'leg'
                : /二头|三头|臂/.test(target)
                  ? 'arm'
                  : 'body'
  return (
    <figure class="fit-muscle-map">
      <svg viewBox="0 0 220 270" role="img" aria-label={`${target}所在身体区域的简化示意`}>
        <g class="fit-anatomy">
          <circle cx="110" cy="25" r="19" />
          <path d="M94 47h32l26 18-8 65-18 22H94l-18-22-8-65z" />
          <path d="M65 65 50 78 34 146 46 150 67 106 76 82M155 65l15 13 16 68-12 4-21-44-9-24" />
          <path d="M94 152h14l-4 50-8 54H80l3-59zM112 152h14l11 45 3 59h-16l-8-54z" />
        </g>
        <g class={`fit-muscles fit-muscles-${region}`}>
          <path class="fit-muscle-chest" d="M82 67q13-9 26 1v25H86zM112 68q13-10 26-1l-4 26h-22z" />
          <path class="fit-muscle-shoulder" d="M80 62 69 70l-2 23 14-7zM140 62l11 8 2 23-14-7z" />
          <path class="fit-muscle-core" d="M91 99h38l-6 38H97z" />
          <path class="fit-muscle-back" d="M82 67h56l-6 42-10 15H98l-10-15z" />
          <path class="fit-muscle-arm" d="m61 96-11 37 7 3 15-36zM159 96l11 37-7 3-15-36z" />
          <path class="fit-muscle-glute" d="M94 135h32l4 22h-18l-2-12-2 12H90z" />
          <path class="fit-muscle-leg" d="m92 159-5 36 10 4 7-40zM116 159l7 40 10-4-5-36z" />
          <path class="fit-muscle-calf" d="m86 207-3 33h10l6-33zM121 207l6 33h10l-3-33z" />
        </g>
      </svg>
      <figcaption>
        <strong>{target}</strong>
        <span class="fit-caption">肌群区域示意 · 非精确解剖图</span>
        <span class="fit-caption">自有 SVG · 本项目原创 · CC0-1.0</span>
      </figcaption>
    </figure>
  )
}

type ChartPoint = { label: string; value: number | null }
function LineChart({
  points,
  label,
  unit,
  secondary
}: {
  points: ChartPoint[]
  label: string
  unit: string
  secondary?: ChartPoint[]
}) {
  const values = [...points, ...(secondary || [])].flatMap((p) =>
    p.value === null ? [] : [p.value]
  )
  if (!values.length) return <Empty title="还没有趋势数据">保存记录后，这里会展示真实变化。</Empty>
  const low = Math.min(...values)
  const high = Math.max(...values)
  const padding = Math.max((high - low) * 0.2, 1)
  const min = Math.max(0, low - padding)
  const max = high + padding
  const x = (i: number) => 56 + (i / Math.max(points.length - 1, 1)) * 570
  const y = (value: number) => 170 - ((value - min) / (max - min)) * 145
  const path = (series: ChartPoint[]) =>
    series
      .map((point, i) =>
        point.value === null
          ? ''
          : `${i === 0 || series[i - 1]?.value === null ? 'M' : 'L'}${x(i).toFixed(1)},${y(point.value).toFixed(1)}`
      )
      .join(' ')
  return (
    <div class="fit-chart">
      <svg viewBox="0 0 650 210" role="img" aria-label={label}>
        <title>{label}</title>
        {[min, (min + max) / 2, max].map((value) => (
          <g>
            <line class="fit-chart-grid" x1="56" x2="626" y1={y(value)} y2={y(value)} />
            <text x="45" y={y(value) + 4} text-anchor="end">
              {number(value)}
            </text>
          </g>
        ))}
        <path class={secondary ? 'fit-chart-secondary' : 'fit-chart-line'} d={path(points)} />
        {secondary && <path class="fit-chart-line" d={path(secondary)} />}
        {points.map(
          (point, i) =>
            point.value !== null && (
              <circle
                class={secondary ? 'fit-chart-dot-muted' : 'fit-chart-dot'}
                cx={x(i)}
                cy={y(point.value)}
                r="3"
              >
                <title>
                  {point.label}：{number(point.value)} {unit}
                </title>
              </circle>
            )
        )}
        <text x="56" y="201">
          {points[0]?.label}
        </text>
        <text x="626" y="201" text-anchor="end">
          {points.at(-1)?.label}
        </text>
      </svg>
    </div>
  )
}

function ExerciseDetail({ data, exerciseId }: { data: FitnessData; exerciseId?: string }) {
  const exercise = data.exercises.find((exercise) => exercise.id === exerciseId)
  if (!exercise)
    return (
      <Empty title="未找到这个动作">
        <a href="/fitness/exercises">返回动作库</a>
      </Empty>
    )
  const history = completedSessions(data).flatMap((session) => {
    const sets = data.sets.filter(
      (set) => set.sessionId === session.id && set.exerciseId === exercise.id && set.completed
    )
    return sets.length ? [{ session, sets }] : []
  })
  const chronological = [...history].reverse()
  const alternatives = data.exercises.filter(
    (candidate) =>
      candidate.id !== exercise.id &&
      candidate.primaryMuscle === exercise.primaryMuscle &&
      candidate.pattern === exercise.pattern
  )
  return (
    <>
      <a class="fit-back" href="/fitness/exercises">
        ← 动作库
      </a>
      <Heading eyebrow={exercise.nameEn} title={exercise.nameZh}>
        {exercise.primaryMuscle} · {exercise.equipment.join(' / ')} · {exercise.difficulty}
      </Heading>
      <div class="fit-grid fit-detail-grid">
        <section class="fit-card">
          {exercise.mediaFrames.length || exercise.mediaUrl ? (
            <>
              <div class="fit-media-frames">
                {(exercise.mediaFrames.length ? exercise.mediaFrames : [exercise.mediaUrl])
                  .filter(Boolean)
                  .map((src, i) => (
                    <figure>
                      <img
                        src={src}
                        alt={`${exercise.nameZh}动作示意 ${i + 1}`}
                        width="500"
                        height="350"
                        loading="lazy"
                        decoding="async"
                      />
                      <figcaption>动作示意 {i + 1}</figcaption>
                    </figure>
                  ))}
              </div>
              <p class="fit-caption">静态动作图：对照动作起止位置。</p>
            </>
          ) : (
            <Empty title="先掌握动作要点">
              暂未收录许可明确的对应图片。请参考下方动作步骤与常见错误。
            </Empty>
          )}
          {exercise.video && (
            <div class="fit-video">
              <div class="fit-video-heading">
                <strong>连续视频</strong>
                <span class="fit-caption">可控循环 · 点击播放</span>
              </div>
              <video
                controls
                muted
                loop
                playsinline
                preload="metadata"
                poster={exercise.video.poster}
                aria-label={`${exercise.nameZh}连续动作视频`}
              >
                <source src={exercise.video.url} type={exercise.video.type} />
              </video>
              <p class="fit-caption">{exercise.video.note}</p>
              <p class="fit-attribution">
                视频来源：
                <a href={exercise.video.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {exercise.video.source}
                </a>{' '}
                · {exercise.video.license} · {exercise.video.attribution}
              </p>
            </div>
          )}
          <p class="fit-attribution">
            素材：
            <a href={exercise.sourceUrl} target="_blank" rel="noopener noreferrer">
              {exercise.source}
            </a>{' '}
            · {exercise.license}
          </p>
        </section>
        <section class="fit-card">
          <MuscleMap exercise={exercise} />
          <dl class="fit-facts">
            <div>
              <dt>辅助肌群</dt>
              <dd>{exercise.secondaryMuscles.join(' · ') || '无'}</dd>
            </div>
            <div>
              <dt>适用场地</dt>
              <dd>{exercise.locations.join(' · ')}</dd>
            </div>
            <div>
              <dt>推荐训练量</dt>
              <dd>
                {exercise.durationSeconds
                  ? `${number(exercise.durationSeconds / 60)} 分钟`
                  : `${exercise.recommendedSets} 组${exercise.repsMax ? ` × ${exercise.repsMin}–${exercise.repsMax} 次` : ' · 按实际次数'}`}
              </dd>
            </div>
          </dl>
        </section>
      </div>
      <div class="fit-grid fit-grid-2">
        <section class="fit-card">
          <p class="fit-eyebrow">HOW TO MOVE</p>
          <h2>动作步骤</h2>
          <ol class="fit-instructions">
            {exercise.instructions.map((step) => (
              <li>{step}</li>
            ))}
          </ol>
        </section>
        <section class="fit-card">
          <p class="fit-eyebrow">KEEP IN MIND</p>
          <h2>常见错误</h2>
          <ul class="fit-mistakes">
            {exercise.commonMistakes.map((mistake) => (
              <li>{mistake}</li>
            ))}
          </ul>
        </section>
      </div>
      <section class="fit-card">
        <div class="fit-section-head">
          <h2>这个动作的积累</h2>
          <span class="fit-muted">{history.length} 次训练</span>
        </div>
        {history.length ? (
          <>
            <div class="fit-grid fit-grid-2">
              <div>
                <h3>每次最高重量 · kg</h3>
                <LineChart
                  points={chronological.map((item) => ({
                    label: dateLabel(item.session.startedAt, data.profile.timezone),
                    value: Math.max(...item.sets.map((set) => set.weight))
                  }))}
                  label="每次训练最高重量趋势"
                  unit="kg"
                />
              </div>
              <div>
                <h3>每次单组最高次数</h3>
                <LineChart
                  points={chronological.map((item) => ({
                    label: dateLabel(item.session.startedAt, data.profile.timezone),
                    value: Math.max(...item.sets.map((set) => set.reps))
                  }))}
                  label="每次训练单组最高次数趋势"
                  unit="次"
                />
              </div>
            </div>
            <div class="fit-history-sets">
              {history.slice(0, 12).map((item) => (
                <div class="fit-record">
                  <a href={`/fitness/history/${item.session.id}`}>
                    {dateLabel(item.session.startedAt, data.profile.timezone)} ↗
                  </a>
                  <div class="fit-tags">
                    {item.sets
                      .sort((a, b) => a.setNumber - b.setNumber)
                      .map((set) => (
                        <span>{setDescription(set)}</span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Empty title="从第一组开始建立基准">训练中记录这个动作后，就能比较每次重量与次数。</Empty>
        )}
      </section>
      <section>
        <div class="fit-section-head">
          <h2>同模式替代动作</h2>
          <span class="fit-muted">按肌群与动作模式匹配</span>
        </div>
        {alternatives.length ? (
          <div class="fit-grid fit-grid-3">
            {alternatives.map((candidate) => (
              <ExerciseCard exercise={candidate} />
            ))}
          </div>
        ) : (
          <p class="fit-muted">当前动作库暂无同模式替代。训练时可结合当天场地和器械查看候选。</p>
        )}
      </section>
    </>
  )
}

function SessionRow({ session, data }: { session: Session; data: FitnessData }) {
  const day = data.days.find((day) => day.id === session.dayId)
  const sets = data.sets.filter((set) => set.sessionId === session.id && set.completed)
  const status = { active: '进行中', completed: '已完成', abandoned: '已结束 · 未完成' }[
    session.status
  ]
  return (
    <a class="fit-session-row" href={`/fitness/history/${session.id}`}>
      <div class="fit-session-date">
        {dateLabel(session.startedAt, data.profile.timezone)}
        <span>
          {new Intl.DateTimeFormat('zh-CN', {
            timeZone: data.profile.timezone,
            year: 'numeric'
          }).format(new Date(session.startedAt))}
        </span>
      </div>
      <div class="fit-session-title">
        <h3>{day?.name || session.dayId}</h3>
        <p class="fit-muted">
          {sets.length} 组 ·{' '}
          {session.duration !== null ? `${number(session.duration / 60)} 分钟` : '尚未结束'} ·{' '}
          {session.location}
        </p>
      </div>
      <span class={`fit-status fit-status-${session.status}`}>{status}</span>
      <span class="fit-row-arrow" aria-hidden="true">
        ↗
      </span>
    </a>
  )
}

function History({ data }: { data: FitnessData }) {
  const sessions = [...data.sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  return (
    <>
      <Heading eyebrow="TRAINING JOURNAL" title="每一次，都留下痕迹。">
        回看训练内容、实际完成组数与表现。你的下一次进步从这里出发。
      </Heading>
      <section class="fit-card">
        <div class="fit-section-head">
          <h2>训练记录</h2>
          <span class="fit-muted">{completedSessions(data).length} 次已完成</span>
        </div>
        {sessions.length ? (
          sessions.map((session) => <SessionRow session={session} data={data} />)
        ) : (
          <Empty title="训练日记还是空白">
            完成第一次训练，系统会自动保存每组数据。
            <br />
            <a class="fit-text-link" href="/fitness/workout">
              开始你的第一场训练 ↗
            </a>
          </Empty>
        )}
      </section>
      <section class="fit-card">
        <h2>查看单动作趋势</h2>
        <p class="fit-muted">进入动作详情，查看真实的重量、次数变化和每组记录。</p>
        <a class="fit-button fit-button-secondary" href="/fitness/exercises">
          打开动作库 ↗
        </a>
      </section>
    </>
  )
}

function HistoryDetail({ data, sessionId }: { data: FitnessData; sessionId?: string }) {
  const session = data.sessions.find((session) => session.id === sessionId)
  if (!session)
    return (
      <Empty title="未找到训练记录">
        <a href="/fitness/history">返回训练历史</a>
      </Empty>
    )
  const items = data.sessionExercises
    .filter((item) => item.sessionId === session.id)
    .sort((a, b) => a.position - b.position)
  const sets = data.sets.filter((set) => set.sessionId === session.id && set.completed)
  return (
    <>
      <a class="fit-back" href="/fitness/history">
        ← 训练历史
      </a>
      <Heading
        eyebrow={dateLabel(session.startedAt, data.profile.timezone)}
        title={data.days.find((day) => day.id === session.dayId)?.name || session.dayId}
      >
        {session.status === 'completed'
          ? '已完成'
          : session.status === 'active'
            ? '训练进行中'
            : '已结束，未标记完成'}{' '}
        · {session.location}
      </Heading>
      <div class="fit-grid fit-grid-3">
        <Stat label="实际完成" value={sets.length} unit="组" />
        <Stat
          label="训练时长"
          value={session.duration === null ? '—' : number(session.duration / 60)}
          unit="分钟"
        />
        <Stat
          label="记录动作"
          value={new Set(sets.map((set) => set.sessionExerciseId)).size}
          unit={`/ ${items.length}`}
        />
      </div>
      {session.status === 'active' && (
        <a class="fit-button" href="/fitness/workout">
          继续这场训练 ↗
        </a>
      )}
      {items.map((item) => {
        const exercise = data.exercises.find((exercise) => exercise.id === item.exerciseId)
        const itemSets = sets
          .filter((set) => set.sessionExerciseId === item.id)
          .sort((a, b) => a.setNumber - b.setNumber)
        return (
          <section class="fit-card">
            <div class="fit-section-head">
              <div>
                <a href={`/fitness/exercises/${item.exerciseId}`}>
                  <h2>{exercise?.nameZh || item.exerciseId} ↗</h2>
                </a>
                <p class="fit-muted">
                  {item.durationSeconds
                    ? `当次目标 ${number(item.durationSeconds / 60)} 分钟`
                    : `当次目标 ${item.sets} 组${item.repsMax ? ` × ${item.repsMin}–${item.repsMax} 次` : ' · 按实际次数'}`}
                </p>
              </div>
              <span class="fit-chip">
                {item.skipped
                  ? `已结束 · 已记录 ${itemSets.length} 组`
                  : `${itemSets.length} 组已记录`}
              </span>
            </div>
            {itemSets.length ? (
              <div class="fit-table-wrap">
                <table>
                  <caption class="fit-sr-only">{exercise?.nameZh}每组记录</caption>
                  <thead>
                    <tr>
                      <th>组</th>
                      <th>重量 kg</th>
                      <th>{item.durationSeconds ? '时长 分钟' : '次数'}</th>
                      <th>RPE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemSets.map((set) => (
                      <tr>
                        <td>{set.setNumber}</td>
                        <td>{number(set.weight)}</td>
                        <td>
                          {item.durationSeconds
                            ? number((set.durationSeconds || 0) / 60)
                            : set.reps}
                        </td>
                        <td>{set.rpe}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p class="fit-muted">此动作没有已完成组。</p>
            )}
          </section>
        )
      })}
      {session.notes && (
        <section class="fit-card">
          <h2>训练备注</h2>
          <p class="fit-notes">{session.notes}</p>
        </section>
      )}
    </>
  )
}

function Progress({ data }: { data: FitnessData }) {
  const currentDate = today(data.profile.timezone)
  const series = rollingWeights(data.weights, currentDate)
  const current = data.weights.find((weight) => weight.date === currentDate)
  const average = series.at(-1)
  const records = [...data.weights].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <>
      <Heading eyebrow="BODY PROGRESS" title="看趋势，不追逐一天的数字。">
        每天记录体重，用 7 日平均观察变化。先以 {data.profile.targetWeightKg} kg
        为观察点，结合体型与力量表现。
      </Heading>
      <div class="fit-grid fit-grid-3">
        <Stat
          label="今日体重"
          value={current ? number(current.weightKg) : '—'}
          unit="kg"
          detail={current ? '今日已记录，可重新保存更正' : '今天尚未记录'}
        />
        <Stat
          label="7 日平均"
          value={
            average?.average === null || average?.average === undefined
              ? '—'
              : number(average.average)
          }
          unit="kg"
          detail={`最近 7 日已有 ${average?.count || 0} 天记录`}
        />
        <Stat
          label="第一观察点"
          value={data.profile.targetWeightKg}
          unit="kg"
          detail="根据体型和力量表现调整"
        />
      </div>
      <section class="fit-card">
        <div class="fit-section-head">
          <h2>记录今天</h2>
          <span class="fit-muted">同日保存会更新原记录</span>
        </div>
        <form class="fit-weight-form" method="post" action="/fitness/api/weight">
          <div class="fit-fields">
            <label>
              日期
              <input type="date" name="date" required max={currentDate} value={currentDate} />
            </label>
            <label>
              体重 kg
              <input
                type="number"
                name="weightKg"
                required
                min="20"
                max="300"
                step="0.1"
                inputmode="decimal"
                value={current?.weightKg ?? ''}
                placeholder="例如 70.0"
              />
            </label>
          </div>
          <button type="submit" class="fit-button">
            保存体重
          </button>
        </form>
      </section>
      <section class="fit-card">
        <div class="fit-section-head">
          <div>
            <h2>30 日体重趋势</h2>
            <p class="fit-caption">缺失日期保留为空。7 日平均只统计窗口内已有记录。</p>
          </div>
          <div class="fit-chart-legend">
            <span>● 每日体重</span>
            <strong>━ 7 日平均</strong>
          </div>
        </div>
        <LineChart
          points={series.map((point) => ({
            label: dateLabel(point.date, data.profile.timezone),
            value: point.weightKg
          }))}
          secondary={series.map((point) => ({
            label: dateLabel(point.date, data.profile.timezone),
            value: point.average
          }))}
          label="最近 30 天体重与 7 日平均体重趋势"
          unit="kg"
        />
      </section>
      <section class="fit-card">
        <div class="fit-section-head">
          <h2>每日记录</h2>
          <span class="fit-muted">{records.length} 天</span>
        </div>
        {records.length ? (
          <div class="fit-table-wrap">
            <table>
              <caption class="fit-sr-only">体重记录</caption>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>体重 kg</th>
                </tr>
              </thead>
              <tbody>
                {records.map((weight) => (
                  <tr>
                    <td>{weight.date}</td>
                    <td>{number(weight.weightKg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="还没有体重记录">填入今天的测量值，开始建立你的趋势。</Empty>
        )}
      </section>
    </>
  )
}

function Achievements({ data }: { data: FitnessData }) {
  const stats = summary(data)
  const pullUpBest = Math.max(
    0,
    ...data.sets
      .filter(
        (set) =>
          set.completed &&
          data.exercises.find((exercise) => exercise.id === set.exerciseId)?.nameZh ===
            '引体向上' &&
          data.sessions.some(
            (session) => session.id === set.sessionId && session.status === 'completed'
          )
      )
      .map((set) => set.reps)
  )
  return (
    <>
      <Heading eyebrow="QUIET CONSISTENCY" title="值得记住的，是你一直在做。">
        等级与徽章记录长期投入。短暂休息不会扣分，也不会抹去已有记录。
      </Heading>
      <div class="fit-grid fit-grid-3">
        <Stat
          label="当前等级"
          value={stats.level}
          unit="Level"
          detail="每完成 10 次训练提升 1 级"
        />
        <Stat label="累计训练" value={stats.total} unit="次" />
        <Stat label="连续达标" value={stats.streak} unit="周" detail="按每周最低训练次数计算" />
      </div>
      <section class="fit-card fit-week-task">
        <div>
          <p class="fit-eyebrow">THIS WEEK</p>
          <h2>本周完成 {data.profile.weeklyMinimum} 次训练</h2>
          <p class="fit-muted">理想目标是 {data.profile.weeklyIdeal} 次，按你的节奏推进。</p>
        </div>
        <div>
          <strong>
            {stats.weekCount}
            <span> / {data.profile.weeklyMinimum}</span>
          </strong>
          <progress
            value={Math.min(stats.weekCount, data.profile.weeklyMinimum)}
            max={data.profile.weeklyMinimum}
            aria-label="本周训练目标完成进度"
          />
        </div>
      </section>
      <section>
        <div class="fit-section-head">
          <h2>里程碑徽章</h2>
          <span class="fit-muted">
            {data.achievements.filter((a) => a.unlockedAt).length} 枚已解锁
          </span>
        </div>
        <div class="fit-grid fit-grid-3">
          {data.achievements.map((achievement) => (
            <article
              class={`fit-card fit-achievement ${achievement.unlockedAt ? 'fit-achievement-unlocked' : ''}`}
            >
              <span class="fit-badge" aria-hidden="true">
                {achievement.unlockedAt ? '✦' : '◇'}
              </span>
              <p class="fit-eyebrow">{achievement.unlockedAt ? '已解锁' : '积累中'}</p>
              <h3>{achievement.name}</h3>
              <p class="fit-muted">{achievement.description}</p>
              {achievement.unlockedAt && (
                <p class="fit-caption">
                  {dateLabel(achievement.unlockedAt, data.profile.timezone)}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
      <section class="fit-card">
        <h2>阶段挑战</h2>
        <div class="fit-challenge">
          <div>
            <h3>标准引体向上 10 次</h3>
            <p class="fit-muted">完成训练中的单组最高次数</p>
          </div>
          <strong>{pullUpBest} / 10</strong>
        </div>
        <div class="fit-challenge">
          <div>
            <h3>积累 12 次训练</h3>
            <p class="fit-muted">按循环计划，完成下一次，再下一次。</p>
          </div>
          <strong>{Math.min(stats.total, 12)} / 12</strong>
        </div>
        <div class="fit-challenge">
          <div>
            <h3>连续 4 周达到训练目标</h3>
            <p class="fit-muted">每周至少 {data.profile.weeklyMinimum} 次</p>
          </div>
          <strong>{Math.min(stats.streak, 4)} / 4</strong>
        </div>
      </section>
    </>
  )
}

export function FitnessPage({
  page,
  data,
  exerciseId,
  sessionId,
  filters = {}
}: {
  page: string
  data: FitnessData
  exerciseId?: string
  sessionId?: string
  filters?: Record<string, string>
}) {
  return (
    <div class="fit-app">
      <div class="fit-shell">
        <div class="fit-brand-row">
          <a class="fit-brand" href="/fitness/dashboard">
            <span class="fit-brand-icon" aria-hidden="true">
              ↗
            </span>
            Personal Fitness<span class="fit-version">V1</span>
          </a>
          <span class="fit-brand-note">持续，比完美重要。</span>
        </div>
        <nav class="fit-nav" aria-label="Fitness 导航">
          {navigation.map(([key, label]) => (
            <a href={`/fitness/${key}`} aria-current={page === key ? 'page' : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <div class="fit-content">
          {filters.saved === '1' && ['plan', 'progress'].includes(page) && (
            <p class="fit-notice" role="status">
              已保存到服务器。
            </p>
          )}
          {page === 'dashboard' && <Dashboard data={data} />}
          {page === 'workout' && (
            <>
              <Heading eyebrow="TODAY’S SESSION" title="专注下一组。">
                记录重量、次数与 RPE。每完成一组，就保存一组。
              </Heading>
              <div id="fitness-workout">
                <p class="fit-muted" role="status">
                  正在读取训练记录…
                </p>
              </div>
              <noscript>训练记录需要启用 JavaScript；计划、历史和体重页面仍可直接使用。</noscript>
            </>
          )}
          {page === 'plan' && <Plan data={data} />}
          {page === 'exercises' &&
            (exerciseId ? (
              <ExerciseDetail data={data} exerciseId={exerciseId} />
            ) : (
              <Exercises data={data} filters={filters} />
            ))}
          {page === 'history' &&
            (sessionId ? (
              <HistoryDetail data={data} sessionId={sessionId} />
            ) : (
              <History data={data} />
            ))}
          {page === 'progress' && <Progress data={data} />}
          {page === 'achievements' && <Achievements data={data} />}
        </div>
        <div class="fit-bottom-note">
          <span>PERSONAL FITNESS SYSTEM</span>
          <span>一次一组，长期积累。</span>
        </div>
      </div>
    </div>
  )
}
