export type Exercise = {
  id: string
  nameZh: string
  nameEn: string
  primaryMuscle: string
  secondaryMuscles: string[]
  equipment: string[]
  difficulty: string
  locations: string[]
  type: string
  pattern: string
  instructions: string[]
  commonMistakes: string[]
  mediaUrl: string
  mediaFrames: string[]
  muscleImageUrl: string
  source: string
  sourceUrl: string
  license: string
  recommendedSets: number
  repsMin: number
  repsMax: number
  durationSeconds: number | null
}
export type Profile = {
  id: number
  timezone: string
  weeklyMinimum: number
  weeklyIdeal: number
  monthlyTarget: number
  heightCm: number
  targetWeightKg: number
}
export type WorkoutDay = { id: string; name: string; position: number; focus: string }
export type PlanExercise = {
  id: string
  dayId: string
  exerciseId: string
  position: number
  sets: number
  repsMin: number
  repsMax: number
  durationSeconds: number | null
  optional: number
  targetWeight: number | null
  note: string
}
export type Session = {
  id: string
  dayId: string
  startedAt: string
  finishedAt: string | null
  duration: number | null
  status: 'active' | 'completed' | 'abandoned'
  notes: string
  location: string
  equipment: string[]
}
export type SessionExercise = PlanExercise & {
  sessionId: string
  planExerciseId: string
  skipped: number
}
export type ExerciseSet = {
  id: string
  sessionId: string
  sessionExerciseId: string
  exerciseId: string
  setNumber: number
  weight: number
  reps: number
  rpe: number
  durationSeconds: number | null
  completed: number
  updatedAt: string
  version: number
}
export type BodyWeight = { date: string; weightKg: number }
export type Achievement = {
  id: string
  name: string
  description: string
  unlockedAt: string | null
}
export type FitnessData = {
  profile: Profile
  exercises: Exercise[]
  days: WorkoutDay[]
  plan: PlanExercise[]
  sessions: Session[]
  sessionExercises: SessionExercise[]
  sets: ExerciseSet[]
  weights: BodyWeight[]
  achievements: Achievement[]
}
