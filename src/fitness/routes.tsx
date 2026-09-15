import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { bodyLimit } from 'hono/body-limit'
import { SiteShell } from '../components/layout'
import { loadFitness } from './repository'
import { summary, today } from './metrics'
import { progression } from './analysis'
import { FitnessPage } from './pages'
import type { FitnessData, SessionExercise } from './types'

export const fitness = new Hono<{ Bindings: CloudflareBindings }>()
fitness.use('*', async (c, next) => {
  c.header('Cache-Control', 'private, no-store')
  c.header('X-Robots-Tag', 'noindex, nofollow')
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    if (c.req.header('Origin') !== new URL(c.req.url).origin)
      throw new HTTPException(403, { message: '请求来源无效，请从本站重新提交。' })
  }
  await next()
})
fitness.use('/api/*', bodyLimit({ maxSize: 16384 }))
fitness.onError((error, c) => {
  const status =
    error instanceof HTTPException
      ? error.status
      : error.message.includes('fitness_conflict') || error.message.includes('fitness_incomplete')
        ? 409
        : 503
  if (status === 503)
    console.error(
      JSON.stringify({ message: 'fitness request failed', path: c.req.path, error: error.message })
    )
  const message =
    error instanceof HTTPException
      ? error.message
      : status === 409
        ? '训练已改变或仍有未完成组，请刷新后重试。'
        : 'Fitness 数据暂时无法读取或保存，请稍后重试。'
  if (
    c.req.header('Accept')?.includes('application/json') ||
    c.req.header('Content-Type')?.includes('application/json')
  )
    return c.json({ error: message }, status)
  c.status(status)
  return c.render(
    <SiteShell>
      <section class="container page-section">
        <h1>{message}</h1>
        <p>尚未确认成功的数据请保留后重试。</p>
        <a href="/fitness/dashboard">返回 Fitness</a>
      </section>
    </SiteShell>,
    { title: 'Fitness 暂时不可用', robots: 'noindex, nofollow' }
  )
})

function fail(message: string, status: 400 | 404 | 409 = 400): never {
  throw new HTTPException(status, { message })
}
function str(value: unknown, label: string, max = 200): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail(`${label}无效`)
  return value.trim()
}
function num(value: unknown, label: string, min: number, max: number, integer = false): number {
  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '') ||
    typeof value === 'boolean' ||
    typeof value === 'object'
  )
    fail(`请填写${label}`)
  const n = Number(value)
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n)))
    fail(`${label}须在 ${min}–${max} 范围内`)
  return n
}
async function json(request: Request): Promise<Record<string, unknown>> {
  let value: unknown
  try {
    value = await request.json()
  } catch {
    fail('请求格式无效')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('请求格式无效')
  return value as Record<string, unknown>
}
function slotFor(data: FitnessData, id: unknown): SessionExercise {
  const slot = data.sessionExercises.find((e) => e.id === id)
  if (!slot) fail('训练动作不存在', 404)
  if (!data.sessions.some((s) => s.id === slot.sessionId && s.status === 'active'))
    fail('这次训练已结束', 409)
  return slot
}

fitness.get('/', (c) => c.redirect('/fitness/dashboard'))
fitness.get('/api/state', async (c) => c.json(await loadFitness(c.env.FITNESS_DB)))

fitness.post('/api/start', async (c) => {
  const body = await json(c.req.raw)
  const id = str(body.id, '训练编号', 64)
  const location = str(body.location, '场地')
  if (!['家里', '宿舍', '健身房', '户外'].includes(location)) fail('请选择训练场地')
  if (
    !Array.isArray(body.equipment) ||
    body.equipment.length > 30 ||
    body.equipment.some((x) => typeof x !== 'string')
  )
    fail('器械无效')
  const data = await loadFitness(c.env.FITNESS_DB)
  const allowed = new Set(data.exercises.flatMap((e) => e.equipment))
  if (body.equipment.some((e) => !allowed.has(String(e)))) fail('器械无效')
  const db = c.env.FITNESS_DB
  const now = new Date().toISOString()
  await db.batch([
    db
      .prepare(
        `INSERT OR IGNORE INTO fitness_session(id,dayId,startedAt,location,equipment)
      SELECT ?,id,?,?,? FROM fitness_workout_day WHERE position=COALESCE((
        SELECT (d.position+1)%4 FROM fitness_session s JOIN fitness_workout_day d ON d.id=s.dayId
        WHERE s.status='completed' ORDER BY s.finishedAt DESC,s.rowid DESC LIMIT 1),0)`
      )
      .bind(id, now, location, JSON.stringify(body.equipment)),
    db
      .prepare(
        `INSERT OR IGNORE INTO fitness_session_exercise
      (id,sessionId,planExerciseId,dayId,exerciseId,position,sets,repsMin,repsMax,durationSeconds,optional,targetWeight,note)
      SELECT ?||':'||e.id,?,e.id,e.dayId,e.exerciseId,e.position,e.sets,e.repsMin,e.repsMax,e.durationSeconds,e.optional,e.targetWeight,e.note
      FROM fitness_workout_exercise e JOIN fitness_session s ON s.dayId=e.dayId WHERE s.id=? AND s.status='active'`
      )
      .bind(id, id, id)
  ])
  return c.json(await loadFitness(db))
})

fitness.post('/api/set', async (c) => {
  const body = await json(c.req.raw)
  const data = await loadFitness(c.env.FITNESS_DB)
  const slot = slotFor(data, body.sessionExerciseId)
  const setNumber = num(body.setNumber, '组数', 1, slot.sets, true)
  const weight = num(body.weight, '重量', 0, 500)
  const reps = num(body.reps, '次数', slot.durationSeconds ? 0 : 1, 200, true)
  const rpe = num(body.rpe, 'RPE', 1, 10)
  const duration = slot.durationSeconds
    ? num(body.durationSeconds, '训练秒数', 1, 7200, true)
    : null
  const version = num(body.version, '记录版本', 0, 100000, true)
  const id = `${slot.id}:${setNumber}`
  const now = new Date().toISOString()
  const result =
    version === 0
      ? await c.env.FITNESS_DB.prepare(
          `INSERT OR IGNORE INTO fitness_exercise_set
    (id,sessionId,sessionExerciseId,exerciseId,setNumber,weight,reps,rpe,durationSeconds,updatedAt)
    VALUES (?,?,?,?,?,?,?,?,?,?)`
        )
          .bind(
            id,
            slot.sessionId,
            slot.id,
            slot.exerciseId,
            setNumber,
            weight,
            reps,
            rpe,
            duration,
            now
          )
          .run()
      : await c.env.FITNESS_DB.prepare(
          `UPDATE fitness_exercise_set SET weight=?,reps=?,rpe=?,durationSeconds=?,updatedAt=?,version=version+1
      WHERE id=? AND version=?`
        )
          .bind(weight, reps, rpe, duration, now, id, version)
          .run()
  if (!result.meta.changes) {
    const existing = await c.env.FITNESS_DB.prepare('SELECT * FROM fitness_exercise_set WHERE id=?')
      .bind(id)
      .first()
    if (
      !existing ||
      existing.weight !== weight ||
      existing.reps !== reps ||
      existing.rpe !== rpe ||
      existing.durationSeconds !== duration
    )
      fail('另一台设备已更新本组；请刷新后检查。', 409)
  }
  return c.json(await loadFitness(c.env.FITNESS_DB))
})

fitness.post('/api/replace', async (c) => {
  const body = await json(c.req.raw)
  const data = await loadFitness(c.env.FITNESS_DB)
  const slot = slotFor(data, body.sessionExerciseId)
  const current = data.exercises.find((e) => e.id === slot.exerciseId)!
  const replacement = data.exercises.find((e) => e.id === body.exerciseId)
  const session = data.sessions.find((s) => s.id === slot.sessionId)!
  if (
    !replacement ||
    replacement.id === current.id ||
    replacement.pattern !== current.pattern ||
    (replacement.primaryMuscle !== current.primaryMuscle &&
      !replacement.secondaryMuscles.includes(current.primaryMuscle)) ||
    !replacement.locations.includes(session.location) ||
    !replacement.equipment.every((e) => session.equipment.includes(e))
  )
    fail('替代动作需符合肌群、动作模式、场地和可用器械。')
  const rank = ['初级', '中级', '高级']
  if (rank.indexOf(replacement.difficulty) > rank.indexOf(current.difficulty))
    fail('请选择相同或更低难度的替代动作。')
  const result = await c.env.FITNESS_DB.prepare(
    `UPDATE fitness_session_exercise SET exerciseId=?,targetWeight=NULL,
    repsMin=?,repsMax=?,durationSeconds=?,note=?,skipped=0 WHERE id=? AND exerciseId=?`
  )
    .bind(
      replacement.id,
      replacement.repsMin,
      replacement.repsMax,
      replacement.durationSeconds,
      '本次替代；重量请重新确认',
      slot.id,
      body.previousExerciseId ?? ''
    )
    .run()
  if (!result.meta.changes) fail('动作已由另一台设备更改，请刷新。', 409)
  return c.json(await loadFitness(c.env.FITNESS_DB))
})

fitness.post('/api/skip', async (c) => {
  const body = await json(c.req.raw)
  const data = await loadFitness(c.env.FITNESS_DB)
  const slot = slotFor(data, body.sessionExerciseId)
  // Explicit skips preserve the planned and actual set counts independently.
  await c.env.FITNESS_DB.prepare('UPDATE fitness_session_exercise SET skipped=? WHERE id=?')
    .bind(body.skipped === false ? 0 : 1, slot.id)
    .run()
  return c.json(await loadFitness(c.env.FITNESS_DB))
})

fitness.post('/api/finish', async (c) => {
  const body = await json(c.req.raw)
  const id = str(body.id, '训练编号')
  const notes = typeof body.notes === 'string' ? body.notes.trim() : ''
  if (notes.length > 2000) fail('备注不能超过 2000 字')
  const status = body.abandon === true ? 'abandoned' : 'completed'
  const now = new Date().toISOString()
  const db = c.env.FITNESS_DB
  const current = await db
    .prepare('SELECT status FROM fitness_session WHERE id=?')
    .bind(id)
    .first<{ status: string }>()
  if (!current) fail('训练不存在', 404)
  if (current.status !== 'active' && current.status !== status) fail('这次训练已结束', 409)
  await db
    .prepare(
      `UPDATE fitness_session SET status=?,finishedAt=?,
    duration=MAX(0,CAST((julianday(?)-julianday(startedAt))*86400 AS INTEGER)),notes=? WHERE id=? AND status='active'`
    )
    .bind(status, now, now, notes, id)
    .run()
  const data = await loadFitness(db)
  const stats = summary(data)
  const completedIds = new Set(
    data.sessions.filter((s) => s.status === 'completed').map((s) => s.id)
  )
  const unlock = [
    stats.total >= 1 ? 'first-workout' : '',
    stats.total >= 12 ? 'twelve-workouts' : '',
    stats.total >= 50 ? 'fifty-workouts' : '',
    stats.streak >= 4 ? 'four-weeks' : '',
    data.sets.some(
      (s) => completedIds.has(s.sessionId) && s.exerciseId === 'pull-up' && s.reps >= 10
    )
      ? 'ten-pull-ups'
      : ''
  ].filter(Boolean)
  if (unlock.length)
    await db.batch(
      unlock.map((a) =>
        db
          .prepare('UPDATE fitness_achievement SET unlockedAt=COALESCE(unlockedAt,?) WHERE id=?')
          .bind(now, a)
      )
    )
  return c.json(await loadFitness(db))
})

fitness.post('/api/weight', async (c) => {
  const body = await c.req.parseBody()
  const date = str(body.date, '日期')
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    fail('日期无效')
  const data = await loadFitness(c.env.FITNESS_DB)
  if (date > today(data.profile.timezone)) fail('不能记录未来体重')
  const weight = num(body.weightKg, '体重', 20, 300)
  await c.env.FITNESS_DB.prepare(
    `INSERT INTO fitness_body_weight(date,weightKg) VALUES(?,?)
    ON CONFLICT(date) DO UPDATE SET weightKg=excluded.weightKg`
  )
    .bind(date, weight)
    .run()
  return c.redirect('/fitness/progress?saved=1', 303)
})
fitness.post('/api/target', async (c) => {
  const body = await c.req.parseBody()
  const id = str(body.planExerciseId, '计划动作')
  const weight = body.targetWeight === '' ? null : num(body.targetWeight, '重量', 0, 500)
  const sets = num(body.sets, '组数', 1, 10, true)
  const min = num(body.repsMin, '最低次数', 0, 200, true)
  const max = num(body.repsMax, '最高次数', min, 200, true)
  const result = await c.env.FITNESS_DB.prepare(
    'UPDATE fitness_workout_exercise SET targetWeight=?,sets=?,repsMin=?,repsMax=? WHERE id=?'
  )
    .bind(weight, sets, min, max, id)
    .run()
  if (!result.meta.changes) fail('计划动作不存在', 404)
  return c.redirect('/fitness/plan?saved=1', 303)
})
fitness.post('/api/suggestion', async (c) => {
  const body = await c.req.parseBody()
  const data = await loadFitness(c.env.FITNESS_DB)
  const plan = data.plan.find((p) => p.id === body.planExerciseId)
  if (!plan) fail('计划动作不存在', 404)
  const suggestion = progression(data, plan)
  if (
    !suggestion ||
    suggestion.sessionId !== body.sessionId ||
    suggestion.targetWeight !== Number(body.targetWeight)
  )
    fail('建议已更新，请重新查看训练计划。', 409)
  const db = c.env.FITNESS_DB
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const result = await db.batch([
    db
      .prepare(
        `INSERT OR IGNORE INTO fitness_training_suggestion(id,provider,planExerciseId,sessionId,payload,status,createdAt,reviewedAt)
      SELECT ?,?,?,?,?, 'accepted',?,? WHERE EXISTS(SELECT 1 FROM fitness_workout_exercise WHERE id=? AND targetWeight IS ?)`
      )
      .bind(
        id,
        suggestion.provider,
        plan.id,
        suggestion.sessionId,
        JSON.stringify(suggestion),
        now,
        now,
        plan.id,
        plan.targetWeight
      ),
    db
      .prepare(
        'UPDATE fitness_workout_exercise SET targetWeight=? WHERE id=? AND EXISTS(SELECT 1 FROM fitness_training_suggestion WHERE id=?)'
      )
      .bind(suggestion.targetWeight, plan.id, id)
  ])
  if (!result[1]!.meta.changes) fail('计划已更新或建议已确认，请刷新。', 409)
  return c.redirect('/fitness/plan?saved=1', 303)
})

fitness.get('/:page/:id?', async (c) => {
  const page = c.req.param('page')
  const id = c.req.param('id')
  if (
    !['dashboard', 'workout', 'plan', 'exercises', 'history', 'progress', 'achievements'].includes(
      page
    ) ||
    (id && !['exercises', 'history'].includes(page))
  )
    return c.notFound()
  const data = await loadFitness(c.env.FITNESS_DB)
  if (
    id &&
    ((page === 'exercises' && !data.exercises.some((e) => e.id === id)) ||
      (page === 'history' && !data.sessions.some((s) => s.id === id)))
  )
    return c.notFound()
  return c.render(
    <SiteShell>
      <FitnessPage
        page={page}
        data={data}
        exerciseId={page === 'exercises' ? id : undefined}
        sessionId={page === 'history' ? id : undefined}
        filters={c.req.query()}
      />
      {page === 'workout' && (
        <script type="module" nonce={c.get('cspNonce')} src="/static/fitness/workout.js"></script>
      )}
    </SiteShell>,
    {
      title: 'Personal Fitness',
      description: '个人训练、习惯与进度。',
      robots: 'noindex, nofollow'
    }
  )
})
