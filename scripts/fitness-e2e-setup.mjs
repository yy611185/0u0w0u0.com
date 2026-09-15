import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

// Playwright's dedicated local D1 directory; never touches the developer or remote database.
const root = resolve(import.meta.dirname, '..')
const run = (args) => {
  const result = spawnSync(
    process.execPath,
    ['node_modules/wrangler/bin/wrangler.js', 'd1', ...args],
    {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, CI: '1' }
    }
  )
  if (result.status !== 0) process.exit(result.status || 1)
}
const local = ['--local', '--persist-to', '.wrangler/fitness-e2e']
run(['migrations', 'apply', 'FITNESS_DB', ...local])
run([
  'execute',
  'FITNESS_DB',
  ...local,
  '--command',
  [
    'DELETE FROM fitness_training_suggestion',
    'DELETE FROM fitness_exercise_set',
    'DELETE FROM fitness_session_exercise',
    'DELETE FROM fitness_session',
    'DELETE FROM fitness_body_weight',
    'DELETE FROM fitness_workout_exercise',
    'DELETE FROM fitness_achievement'
  ].join(';')
])
run(['execute', 'FITNESS_DB', ...local, '--file', 'seeds/fitness.sql'])
