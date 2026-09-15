import type { FitnessData, Exercise, Session } from './types'

export async function loadFitness(db: D1Database): Promise<FitnessData> {
  // A D1 batch provides a consistent view of the training snapshot.
  const tables = [
    'profile',
    'exercise',
    'workout_day',
    'workout_exercise',
    'session',
    'session_exercise',
    'exercise_set',
    'body_weight',
    'achievement'
  ]
  const results = await db.batch<Record<string, unknown>>(
    tables.map((table) => db.prepare(`SELECT * FROM fitness_${table}`))
  )
  const profile = results[0]!.results[0] as FitnessData['profile'] | undefined
  if (!profile) throw new Error('Fitness database has not been seeded')
  return {
    profile,
    exercises: results[1]!.results.map((row) => JSON.parse(row.data as string) as Exercise),
    days: results[2]!.results as FitnessData['days'],
    plan: results[3]!.results as FitnessData['plan'],
    sessions: results[4]!.results.map(
      (row) => ({ ...row, equipment: JSON.parse(row.equipment as string) as string[] }) as Session
    ),
    sessionExercises: results[5]!.results as FitnessData['sessionExercises'],
    sets: results[6]!.results as FitnessData['sets'],
    weights: results[7]!.results as FitnessData['weights'],
    achievements: results[8]!.results as FitnessData['achievements']
  }
}
