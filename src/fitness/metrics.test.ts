import { describe, expect, it } from 'vitest'
import { rollingWeights, summary, today, weekStart } from './metrics'
import { progression } from './analysis'
import type { FitnessData, Session } from './types'

function fixture(): FitnessData {
  return {
    profile: {
      id: 1,
      timezone: 'Asia/Taipei',
      weeklyMinimum: 3,
      weeklyIdeal: 4,
      monthlyTarget: 12,
      heightCm: 180,
      targetWeightKg: 68
    },
    exercises: [],
    days: ['A', 'B', 'C', 'D'].map((id, position) => ({ id, position, name: id, focus: id })),
    plan: [],
    sessions: [],
    sessionExercises: [],
    sets: [],
    weights: [],
    achievements: []
  }
}
function session(date: string, dayId = 'A'): Session {
  return {
    id: date,
    dayId,
    startedAt: `${date}T04:00:00Z`,
    finishedAt: `${date}T05:00:00Z`,
    duration: 3600,
    status: 'completed',
    notes: '',
    location: '健身房',
    equipment: []
  }
}
describe('Fitness calendar and progress', () => {
  it('uses the profile timezone at day and Monday boundaries', () => {
    expect(today('Asia/Taipei', new Date('2026-09-13T16:00:00Z'))).toBe('2026-09-14')
    expect(weekStart('2026-09-13')).toBe('2026-09-07')
    expect(weekStart('2026-09-14')).toBe('2026-09-14')
  })
  it('continues the cycle across weeks and ignores abandoned sessions', () => {
    const data = fixture()
    data.sessions = [
      session('2026-09-10', 'C'),
      { ...session('2026-09-14', 'D'), status: 'abandoned' }
    ]
    const stats = summary(data, new Date('2026-09-15T00:00:00Z'))
    expect(stats.nextDay.id).toBe('D')
    expect(stats.weekCount).toBe(0)
    expect(stats.daysSince).toBe(5)
    data.sessions.push(session('2026-09-15', 'D'))
    expect(summary(data, new Date('2026-09-15T10:00:00Z')).nextDay.id).toBe('A')
  })
  it('keeps last week streak while the current week is in progress', () => {
    const data = fixture()
    data.sessions = [
      '2026-08-31',
      '2026-09-02',
      '2026-09-04',
      '2026-09-07',
      '2026-09-09',
      '2026-09-11',
      '2026-09-14'
    ].map((d) => session(d))
    expect(summary(data, new Date('2026-09-15T00:00:00Z')).streak).toBe(2)
    expect(summary(data, new Date('2026-09-22T00:00:00Z')).streak).toBe(0)
    expect(summary(data, new Date('2026-09-22T00:00:00Z')).total).toBe(7)
  })
  it('averages only real measurements within seven calendar days, including before the displayed window', () => {
    const weights = [
      { date: '2026-08-15', weightKg: 70 },
      { date: '2026-08-17', weightKg: 72 },
      { date: '2026-09-14', weightKg: 68 }
    ]
    const rows = rollingWeights(weights, '2026-09-15')
    expect(rows).toHaveLength(30)
    expect(rows[0]).toEqual({ date: '2026-08-17', weightKg: 72, average: 71, count: 2 })
    expect(rows.at(-1)).toEqual({ date: '2026-09-15', weightKg: null, average: 68, count: 1 })
    expect(rows.find((r) => r.date === '2026-09-01')?.average).toBeNull()
  })
})
describe('explicit progression proposals', () => {
  it('requires every set to meet the top rep range at a consistent weight and RPE ≤ 8', () => {
    const data = fixture()
    const plan = {
      id: 'A-1',
      dayId: 'A',
      exerciseId: 'barbell-bench-press',
      position: 0,
      sets: 3,
      repsMin: 6,
      repsMax: 10,
      durationSeconds: null,
      optional: 0,
      targetWeight: 50,
      note: ''
    }
    data.plan = [plan]
    data.sessions = [session('2026-09-15')]
    data.sessionExercises = [
      { ...plan, id: 'slot', sessionId: '2026-09-15', planExerciseId: plan.id, skipped: 0 }
    ]
    data.sets = [1, 2, 3].map((n) => ({
      id: String(n),
      sessionId: '2026-09-15',
      sessionExerciseId: 'slot',
      exerciseId: plan.exerciseId,
      setNumber: n,
      weight: 50,
      reps: 10,
      rpe: 7.5,
      durationSeconds: null,
      completed: 1,
      updatedAt: '2026-09-15T00:00:00Z',
      version: 1
    }))
    expect(progression(data, plan)?.targetWeight).toBe(52.5)
    expect(plan.targetWeight).toBe(50)
    data.sets[2]!.rpe = 9
    expect(progression(data, plan)).toBeNull()
    data.sets[2]!.rpe = 7.5
    data.sets[1]!.reps = 9
    expect(progression(data, plan)).toBeNull()
    data.sets.pop()
    expect(progression(data, plan)).toBeNull()
  })
})
