import type { BodyWeight, FitnessData } from './types'

export function today(timezone = 'Asia/Taipei', now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now)
}
export function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}
export function weekStart(date: string): string {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay()
  return shiftDate(date, -((day + 6) % 7))
}
export function summary(data: FitnessData, now = new Date()) {
  const date = today(data.profile.timezone, now)
  const completed = data.sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))
  const dates = completed.map((s) => today(data.profile.timezone, new Date(s.finishedAt!)))
  const start = weekStart(date)
  const weekCount = dates.filter((d) => d >= start && d <= date).length
  const monthCount = dates.filter((d) => d.slice(0, 7) === date.slice(0, 7)).length
  let cursor = weekCount >= data.profile.weeklyMinimum ? start : shiftDate(start, -7)
  let streak = 0
  while (dates.filter((d) => weekStart(d) === cursor).length >= data.profile.weeklyMinimum) {
    streak++
    cursor = shiftDate(cursor, -7)
  }
  const lastDate = dates[0] ?? null
  const last = completed[0]
  const days = [...data.days].sort((a, b) => a.position - b.position)
  const nextDay = days[(days.findIndex((d) => d.id === last?.dayId) + 1) % days.length]!
  return {
    weekCount,
    monthCount,
    streak,
    total: completed.length,
    lastDate,
    daysSince: lastDate ? Math.round((Date.parse(date) - Date.parse(lastDate)) / 86400000) : null,
    level: 1 + Math.floor(completed.length / 10),
    nextDay
  }
}
export function rollingWeights(weights: BodyWeight[], end: string) {
  const values = new Map(weights.map((w) => [w.date, w.weightKg]))
  return Array.from({ length: 30 }, (_, i) => {
    const date = shiftDate(end, i - 29)
    const window = Array.from({ length: 7 }, (_, n) => values.get(shiftDate(date, -n))).filter(
      (v): v is number => v !== undefined
    )
    return {
      date,
      weightKg: values.get(date) ?? null,
      count: window.length,
      average: window.length ? window.reduce((a, b) => a + b, 0) / window.length : null
    }
  })
}
