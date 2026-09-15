import type { FitnessData, PlanExercise } from './types'

export type TrainingSuggestion = {
  schemaVersion: 1
  provider: string
  planExerciseId: string
  sessionId: string
  targetWeight: number
  previousWeight: number
  reason: string
}
/** Providers return proposals only. Applying changes requires a separate explicit user action. */
export interface TrainingAnalysisService {
  analyze(data: FitnessData): Promise<TrainingSuggestion[]>
}
export function progression(data: FitnessData, plan: PlanExercise): TrainingSuggestion | null {
  if (!plan.repsMax || plan.durationSeconds || plan.targetWeight === 0) return null
  const sessions = data.sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))
  for (const session of sessions) {
    const slot = data.sessionExercises.find(
      (e) =>
        e.sessionId === session.id &&
        e.planExerciseId === plan.id &&
        e.exerciseId === plan.exerciseId
    )
    if (!slot) continue
    const sets = data.sets.filter((s) => s.sessionExerciseId === slot.id && s.completed)
    const first = sets[0]
    if (
      !first ||
      first.weight <= 0 ||
      sets.length < slot.sets ||
      slot.repsMax !== plan.repsMax ||
      sets.some((s) => s.reps < plan.repsMax || s.rpe > 8 || s.weight !== first.weight)
    )
      return null
    const targetWeight = Math.round((first.weight + 2.5) * 100) / 100
    if (plan.targetWeight !== null && plan.targetWeight >= targetWeight) return null
    return {
      schemaVersion: 1,
      provider: 'double-progression-v1',
      planExerciseId: plan.id,
      sessionId: session.id,
      targetWeight,
      previousWeight: first.weight,
      reason: `上次 ${sets.length} 组均达到 ${plan.repsMax} 次，且 RPE ≤ 8。可尝试增加 2.5 kg；需你确认。`
    }
  }
  return null
}
export class RuleBasedTrainingAnalysisService implements TrainingAnalysisService {
  analyze(data: FitnessData): Promise<TrainingSuggestion[]> {
    return Promise.resolve(
      data.plan.map((p) => progression(data, p)).filter((s): s is TrainingSuggestion => s !== null)
    )
  }
}
