const root = document.querySelector('#fitness-workout')
let data
let focusedId = location.hash.slice(1)
let editingSet = null
let busy = false
let dirty = false
let startId = crypto.randomUUID()
const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )
const hidden = (name, value) => `<input type="hidden" name="${name}" value="${escape(value)}">`
const dateTime = (date) =>
  new Date(date).toLocaleString('zh-CN', {
    timeZone: data.profile.timezone,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
const exerciseFor = (id) => data.exercises.find((e) => e.id === id)
const savedSets = (slot) =>
  data.sets.filter((s) => s.sessionExerciseId === slot.id).sort((a, b) => a.setNumber - b.setNumber)
const target = (slot) =>
  `${slot.sets} 组${slot.durationSeconds ? ` · ${slot.durationSeconds / 60} 分钟` : slot.repsMax ? ` × ${slot.repsMin}–${slot.repsMax} 次` : ' · 按实际次数'}${slot.note ? ` · ${escape(slot.note)}` : ''}`
const sessionSlots = (session) =>
  data.sessionExercises
    .filter((e) => e.sessionId === session.id)
    .sort((a, b) => a.position - b.position)
function lastSets(exerciseId) {
  const sessions = data.sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
  for (const session of sessions) {
    const sets = data.sets
      .filter((s) => s.sessionId === session.id && s.exerciseId === exerciseId && s.completed)
      .sort((a, b) => a.setNumber - b.setNumber)
    if (sets.length) return sets
  }
  return []
}
function message(text, error = false) {
  const box = root.querySelector('[data-feedback]')
  if (!box) return
  box.textContent = text
  box.setAttribute('role', error ? 'alert' : 'status')
  box.classList.toggle('fit-error', error)
  if (error) box.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}
async function request(path, body) {
  const response = await fetch(`/fitness/api/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store'
  })
  if (!response.ok) {
    const result = await response.json().catch(() => ({ error: '服务器暂时不可用，请重试。' }))
    throw new Error(result.error || '无法保存，请重试。')
  }
  return response.json()
}
function media(exercise) {
  return `<details class="fit-teaching"><summary>查看动作示意与要点</summary>
    ${exercise.mediaFrames.length ? `<div class="fit-media-pair">${exercise.mediaFrames.map((src, i) => `<img src="${escape(src)}" width="600" height="600" loading="lazy" alt="${escape(exercise.nameZh)}，${i === 0 ? '起始' : '结束'}姿势">`).join('')}</div><p class="fit-muted">双帧姿势示意</p>` : '<p class="fit-muted">暂未收录许可明确的对应图片，请参考以下步骤。</p>'}
    <ol>${exercise.instructions.map((step) => `<li>${escape(step)}</li>`).join('')}</ol>
    <p><a href="/fitness/exercises/${escape(exercise.id)}">完整教学、肌群与历史 →</a></p></details>`
}
function renderStart() {
  const completed = data.sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
  const days = [...data.days].sort((a, b) => a.position - b.position)
  const next = days[(days.findIndex((d) => d.id === completed[0]?.dayId) + 1) % days.length]
  const plan = data.plan.filter((p) => p.dayId === next.id).sort((a, b) => a.position - b.position)
  const equipment = [...new Set(data.exercises.flatMap((e) => e.equipment))].sort()
  root.innerHTML = `<div data-feedback role="status" aria-live="polite"></div>
    <div class="fit-card fit-start"><p class="fit-eyebrow">YOUR NEXT SESSION</p><h2>Day ${escape(next.id)} · ${escape(next.name)}</h2>
    <p class="fit-muted">45–60 分钟 · ${plan.length} 个动作 · ${escape(next.focus)}</p>
    <form data-action="start"><div class="fit-fields"><label>今天在哪里训练<select name="location">${['健身房', '家里', '宿舍', '户外'].map((l) => `<option>${l}</option>`).join('')}</select></label></div>
    <details><summary>确认今天可用的器械</summary><fieldset class="fit-equipment"><legend>仅用于筛选本次替代动作</legend>${equipment.map((e) => `<label><input type="checkbox" name="equipment" value="${escape(e)}" checked> ${escape(e)}</label>`).join('')}</fieldset></details>
    <button class="fit-button fit-primary" type="submit">开始 Day ${escape(next.id)} 训练 →</button></form>
    <p class="fit-muted">完成一组就保存一组。离开页面后，可在另一台设备继续。</p></div>
    <h2>今天的训练</h2><div class="fit-grid">${plan
      .map((p, i) => {
        const e = exerciseFor(p.exerciseId)
        const last = lastSets(e.id)
        return `<article class="fit-card"><p class="fit-eyebrow">${String(i + 1).padStart(2, '0')}${p.optional ? ' · 可选' : ''}</p><h3><a href="/fitness/exercises/${escape(e.id)}">${escape(e.nameZh)}</a></h3><p>${target(p)}</p><p class="fit-muted">目标重量：${p.targetWeight === null ? '首次请按实际填写' : `${p.targetWeight} kg`}</p><p class="fit-muted">上次：${last.length ? last.map((s) => `${s.weight} kg × ${s.reps}`).join(' / ') : '还没有记录'}</p></article>`
      })
      .join('')}</div>`
}
function alternatives(slot, session) {
  const current = exerciseFor(slot.exerciseId)
  const rank = ['初级', '中级', '高级']
  return data.exercises.filter(
    (e) =>
      e.id !== current.id &&
      e.pattern === current.pattern &&
      (e.primaryMuscle === current.primaryMuscle ||
        e.secondaryMuscles.includes(current.primaryMuscle)) &&
      e.locations.includes(session.location) &&
      e.equipment.every((eq) => session.equipment.includes(eq)) &&
      rank.indexOf(e.difficulty) <= rank.indexOf(current.difficulty)
  )
}
function renderActive(session) {
  const slots = sessionSlots(session)
  let slot = slots.find((e) => e.id === focusedId)
  slot ??= slots.find((e) => !e.skipped && savedSets(e).length < e.sets) ?? slots[0]
  focusedId = slot.id
  const exercise = exerciseFor(slot.exerciseId)
  const sets = savedSets(slot)
  const last = lastSets(exercise.id)
  const edit = sets.find((s) => s.setNumber === editingSet)
  const nextNumber = Array.from({ length: slot.sets }, (_, i) => i + 1).find(
    (n) => !sets.some((s) => s.setNumber === n)
  )
  const setNumber = edit?.setNumber ?? nextNumber
  const previous = last.find((s) => s.setNumber === setNumber) ?? last[0]
  const available = alternatives(slot, session)
  const complete = slots.every((e) => e.skipped || savedSets(e).length >= e.sets)
  const totalSets = slots.reduce((sum, e) => sum + e.sets, 0)
  const doneSets = slots.reduce((sum, e) => sum + savedSets(e).length, 0)
  const firstDate =
    data.sessions
      .filter((s) => s.status === 'completed')
      .map((s) => s.startedAt)
      .sort()[0] ?? session.startedAt
  const restoring = (Date.now() - Date.parse(firstDate)) / 86400000 < 14
  root.innerHTML = `<div data-feedback role="status" aria-live="polite"></div>
    <div class="fit-workout-top"><div><p class="fit-eyebrow">DAY ${escape(session.dayId)} · IN PROGRESS</p><p class="fit-muted">${escape(session.location)} · ${dateTime(session.startedAt)} 开始</p></div><span class="fit-pill">${doneSets} / ${totalSets} 组已保存</span></div>
    <progress max="${totalSets}" value="${doneSets}" aria-label="已完成训练组数"></progress>
    <p class="fit-muted">${restoring ? '恢复训练前两周：RPE 6–7，约保留 3 次余力。' : '逐渐提升至 RPE 7–8，保留余力。'}</p>
    <div class="fit-training-layout"><section class="fit-card fit-focus" aria-label="专注训练">
      <p class="fit-eyebrow">EXERCISE ${String(slot.position + 1).padStart(2, '0')} / ${String(slots.length).padStart(2, '0')}</p>
      <h2 tabindex="-1" data-focus-title>${escape(exercise.nameZh)}</h2><p class="fit-muted">${escape(exercise.nameEn)} · ${escape(exercise.primaryMuscle)}${exercise.secondaryMuscles.length ? ' · ' + exercise.secondaryMuscles.map(escape).join(' · ') : ''}</p>
      <p>${target(slot)}${slot.targetWeight !== null ? ` · 目标 ${slot.targetWeight} kg` : ''}</p>
      <div class="fit-last"><strong>上一次</strong><p>${last.length ? last.map((s) => (s.durationSeconds ? `${s.durationSeconds / 60} 分钟 · RPE ${s.rpe}` : `${s.weight} kg × ${s.reps} · RPE ${s.rpe}`)).join(' / ') : '第一次记录，从适合今天的重量开始。'}</p></div>
      ${
        slot.skipped
          ? '<p class="fit-muted">已结束此动作，已完成组仍保留。</p>'
          : setNumber
            ? `<form data-action="set">${hidden('sessionExerciseId', slot.id)}${hidden('setNumber', setNumber)}${hidden('version', edit?.version ?? 0)}
        <h3>${edit ? '修改' : '记录'}第 ${setNumber} / ${slot.sets} 组</h3>
        <div class="fit-fields fit-numbers"><label>重量 <span>kg</span><input name="weight" type="number" inputmode="decimal" min="0" max="500" step="0.25" required value="${escape(edit?.weight ?? slot.targetWeight ?? previous?.weight ?? (exercise.equipment.every((e) => ['徒手', '单杠'].includes(e)) ? 0 : ''))}"></label>
        <label>次数<input name="reps" type="number" inputmode="numeric" min="${slot.durationSeconds ? 0 : 1}" max="200" step="1" required value="${escape(edit?.reps ?? (slot.durationSeconds ? 0 : (previous?.reps ?? '')))}"></label>
        <label>RPE <span>1–10</span><input name="rpe" type="number" inputmode="decimal" min="1" max="10" step="0.5" required value="${escape(edit?.rpe ?? '')}" placeholder="${restoring ? '6–7' : '7–8'}"></label>
        ${slot.durationSeconds ? `<label>实际时长 <span>秒</span><input name="durationSeconds" type="number" inputmode="numeric" min="1" max="7200" step="1" required value="${edit?.durationSeconds ?? slot.durationSeconds}"></label>` : ''}</div>
        <p class="fit-muted">徒手动作重量填 0；哑铃按单只重量记录。RPE 表示主观用力程度，10 为无余力。</p>
        <button type="submit" class="fit-button fit-primary fit-save">${edit ? '保存修改' : '完成本组'} ✓</button>${edit ? '<button type="button" class="fit-button" data-cancel-edit>取消修改</button>' : ''}</form>`
            : '<p class="fit-saved">本动作已完成 ✓</p>'
      }
      ${sets.length ? `<details ${!setNumber ? 'open' : ''}><summary>已保存 ${sets.length} 组 · 查看 / 修改</summary><ul class="fit-set-list">${sets.map((s) => `<li><span>第 ${s.setNumber} 组 · ${s.weight} kg × ${s.reps} · RPE ${s.rpe}${s.durationSeconds ? ` · ${s.durationSeconds} 秒` : ''}</span>${!slot.skipped ? `<button type="button" class="fit-button" data-edit="${s.setNumber}">修改第 ${s.setNumber} 组</button>` : ''}</li>`).join('')}</ul></details>` : ''}
      ${media(exercise)}
      ${!sets.length && !slot.skipped ? `<details><summary>器械不合适？替换本次动作</summary>${available.length ? `<form data-action="replace">${hidden('sessionExerciseId', slot.id)}${hidden('previousExerciseId', slot.exerciseId)}<label>符合当前场地、器械、肌群、动作模式与难度的替代<select name="exerciseId">${available.map((e) => `<option value="${escape(e.id)}">${escape(e.nameZh)} · ${escape(e.equipment.join('、'))}</option>`).join('')}</select></label><button class="fit-button" type="submit">确认替换</button></form>` : '<p class="fit-muted">当前器械条件下没有合适替代，可结束此动作继续训练。</p>'}</details>` : ''}
      <form data-action="skip">${hidden('sessionExerciseId', slot.id)}${hidden('skipped', slot.skipped ? 'false' : 'true')}<button class="fit-button" type="submit">${slot.skipped ? '恢复此动作' : '结束此动作，保留已完成组'}</button></form>
    </section><aside class="fit-card fit-session-list"><h2>训练清单</h2><ol>${slots.map((e) => `<li><button type="button" data-slot="${escape(e.id)}" class="fit-button ${e.id === slot.id ? 'is-current' : ''}" ${e.id === slot.id ? 'aria-current="step"' : ''}><span>${escape(exerciseFor(e.exerciseId).nameZh)}</span><small>${e.skipped ? '已结束' : `${savedSets(e).length} / ${e.sets}`}</small></button></li>`).join('')}</ol>
      <p class="fit-muted">${complete ? '本次动作均已处理，可以完成训练。' : '按实际情况记录；未完成的动作可明确结束。'}</p>
      <form data-action="finish">${hidden('id', session.id)}<label>训练备注（可选）<textarea name="notes" rows="2" maxlength="2000" placeholder="今天感觉如何？">${escape(session.notes)}</textarea></label>
      <button type="submit" class="fit-button fit-primary" ${!complete || doneSets === 0 ? 'disabled' : ''}>完成训练并保存</button></form>
      <details><summary>提前结束训练</summary><p class="fit-muted">保留已记数据，标记为未完成，不推进 A–D 循环。</p><form data-action="abandon">${hidden('id', session.id)}<button class="fit-button" type="submit">确认提前结束</button></form></details>
    </aside></div>`
}
function render() {
  const session = data.sessions.find((s) => s.status === 'active')
  if (session) renderActive(session)
  else renderStart()
}
async function refresh() {
  try {
    data = await request('state')
    render()
  } catch (error) {
    root.innerHTML =
      '<div class="fit-card"><h2>暂时无法载入训练</h2><p data-feedback role="alert"></p><button class="fit-button" data-reload>重新加载</button></div>'
    message(error.message, true)
  }
}
root?.addEventListener('input', () => {
  dirty = true
})
root?.addEventListener('change', (event) => {
  if (event.target.name === 'location') {
    const location = event.target.value
    const defaults =
      location === '健身房'
        ? null
        : location === '户外'
          ? ['徒手', '单杠']
          : ['徒手', '哑铃', '可调哑铃']
    root.querySelectorAll('[name="equipment"]').forEach((input) => {
      input.checked = !defaults || defaults.includes(input.value)
    })
  }
})
root?.addEventListener('click', (event) => {
  if (busy) return
  const button = event.target.closest('button')
  if (!button) return
  if (button.hasAttribute('data-reload')) {
    void refresh()
    return
  }
  const changing =
    button.dataset.slot || button.dataset.edit || button.hasAttribute('data-cancel-edit')
  if (changing && dirty && !confirm('当前输入尚未保存，切换会丢弃这些输入。继续？')) return
  if (button.dataset.slot) {
    focusedId = button.dataset.slot
    editingSet = null
    history.replaceState(null, '', `#${focusedId}`)
  }
  if (button.dataset.edit) editingSet = Number(button.dataset.edit)
  if (button.hasAttribute('data-cancel-edit')) editingSet = null
  if (changing) {
    dirty = false
    render()
    root.querySelector('[data-focus-title]')?.focus({ preventScroll: true })
  }
})
root?.addEventListener('submit', async (event) => {
  event.preventDefault()
  if (busy) return
  const form = event.target
  const action = form.dataset.action
  if (!action) return
  const values = Object.fromEntries(new FormData(form))
  if (action === 'start') {
    values.id = startId
    values.equipment = new FormData(form).getAll('equipment')
  }
  if (action === 'skip') values.skipped = values.skipped === 'true'
  if (action === 'abandon') values.abandon = true
  busy = true
  const buttons = [...root.querySelectorAll('button')]
  const enabled = buttons.filter((b) => !b.disabled)
  enabled.forEach((b) => {
    b.disabled = true
  })
  form.setAttribute('aria-busy', 'true')
  message('正在保存到服务器…')
  try {
    data = await request(action === 'abandon' ? 'finish' : action, values)
    dirty = false
    editingSet = null
    if (action === 'finish' || action === 'abandon') {
      location.assign(`/fitness/history/${encodeURIComponent(values.id)}`)
      return
    }
    if (action === 'start') startId = crypto.randomUUID()
    if (action === 'set' || action === 'skip') {
      const session = data.sessions.find((s) => s.status === 'active')
      const slot = data.sessionExercises.find((e) => e.id === focusedId)
      if (session && slot && (slot.skipped || savedSets(slot).length >= slot.sets)) {
        focusedId =
          sessionSlots(session).find((e) => !e.skipped && savedSets(e).length < e.sets)?.id ??
          slot.id
      }
    }
    render()
    message('已保存到服务器 ✓')
  } catch (error) {
    message(`${error.message} 输入仍保留在当前页面；请检查网络后重试。`, true)
  } finally {
    busy = false
    form.removeAttribute('aria-busy')
    enabled.forEach((b) => {
      b.disabled = false
    })
  }
})
window.addEventListener('beforeunload', (event) => {
  if (dirty || busy) {
    event.preventDefault()
    event.returnValue = ''
  }
})
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !dirty && !busy && data) void refresh()
})
if (root) void refresh()
