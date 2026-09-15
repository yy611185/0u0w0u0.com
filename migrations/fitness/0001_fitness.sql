-- All Fitness records are isolated from the public site's content.
PRAGMA foreign_keys = ON;
CREATE TABLE fitness_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  timezone TEXT NOT NULL DEFAULT 'Asia/Taipei',
  weeklyMinimum INTEGER NOT NULL DEFAULT 3,
  weeklyIdeal INTEGER NOT NULL DEFAULT 4,
  monthlyTarget INTEGER NOT NULL DEFAULT 12,
  heightCm REAL NOT NULL DEFAULT 180,
  targetWeightKg REAL NOT NULL DEFAULT 68
);
CREATE TABLE fitness_exercise (id TEXT PRIMARY KEY, data TEXT NOT NULL CHECK(json_valid(data)));
CREATE TABLE fitness_workout_plan (id TEXT PRIMARY KEY, name TEXT NOT NULL, version INTEGER NOT NULL);
CREATE TABLE fitness_workout_day (
  id TEXT PRIMARY KEY, planId TEXT NOT NULL REFERENCES fitness_workout_plan(id),
  name TEXT NOT NULL, position INTEGER NOT NULL UNIQUE CHECK(position BETWEEN 0 AND 3), focus TEXT NOT NULL
);
CREATE TABLE fitness_workout_exercise (
  id TEXT PRIMARY KEY, dayId TEXT NOT NULL REFERENCES fitness_workout_day(id),
  exerciseId TEXT NOT NULL REFERENCES fitness_exercise(id), position INTEGER NOT NULL,
  sets INTEGER NOT NULL CHECK(sets BETWEEN 1 AND 10), repsMin INTEGER NOT NULL,
  repsMax INTEGER NOT NULL, durationSeconds INTEGER, optional INTEGER NOT NULL DEFAULT 0 CHECK(optional IN(0,1)),
  targetWeight REAL CHECK(targetWeight >= 0), note TEXT NOT NULL DEFAULT '', UNIQUE(dayId,position)
);
CREATE TABLE fitness_session (
  id TEXT PRIMARY KEY, dayId TEXT NOT NULL REFERENCES fitness_workout_day(id),
  startedAt TEXT NOT NULL, finishedAt TEXT, duration INTEGER CHECK(duration >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN('active','completed','abandoned')),
  notes TEXT NOT NULL DEFAULT '', location TEXT NOT NULL, equipment TEXT NOT NULL CHECK(json_valid(equipment))
);
CREATE UNIQUE INDEX fitness_one_active_session ON fitness_session(status) WHERE status = 'active';
CREATE INDEX fitness_session_finished ON fitness_session(finishedAt);
CREATE TABLE fitness_session_exercise (
  id TEXT PRIMARY KEY, sessionId TEXT NOT NULL REFERENCES fitness_session(id),
  planExerciseId TEXT NOT NULL REFERENCES fitness_workout_exercise(id), dayId TEXT NOT NULL,
  exerciseId TEXT NOT NULL REFERENCES fitness_exercise(id), position INTEGER NOT NULL,
  sets INTEGER NOT NULL CHECK(sets BETWEEN 1 AND 10), repsMin INTEGER NOT NULL, repsMax INTEGER NOT NULL,
  durationSeconds INTEGER, optional INTEGER NOT NULL CHECK(optional IN(0,1)),
  targetWeight REAL, note TEXT NOT NULL, skipped INTEGER NOT NULL DEFAULT 0 CHECK(skipped IN(0,1)),
  UNIQUE(sessionId,position)
);
CREATE TABLE fitness_exercise_set (
  id TEXT PRIMARY KEY, sessionId TEXT NOT NULL REFERENCES fitness_session(id),
  sessionExerciseId TEXT NOT NULL REFERENCES fitness_session_exercise(id),
  exerciseId TEXT NOT NULL REFERENCES fitness_exercise(id), setNumber INTEGER NOT NULL CHECK(setNumber BETWEEN 1 AND 10),
  weight REAL NOT NULL CHECK(weight BETWEEN 0 AND 500), reps INTEGER NOT NULL CHECK(reps BETWEEN 0 AND 200),
  rpe REAL NOT NULL CHECK(rpe BETWEEN 1 AND 10), durationSeconds INTEGER CHECK(durationSeconds BETWEEN 1 AND 7200),
  completed INTEGER NOT NULL DEFAULT 1 CHECK(completed IN(0,1)), updatedAt TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1, UNIQUE(sessionExerciseId,setNumber)
);
CREATE INDEX fitness_set_exercise ON fitness_exercise_set(exerciseId,sessionId);
CREATE TABLE fitness_body_weight (
  date TEXT PRIMARY KEY CHECK(length(date)=10), weightKg REAL NOT NULL CHECK(weightKg BETWEEN 20 AND 300)
);
CREATE TABLE fitness_achievement (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, unlockedAt TEXT
);
-- Future analysis providers propose changes; only explicit acceptance applies them.
CREATE TABLE fitness_training_suggestion (
  id TEXT PRIMARY KEY, provider TEXT NOT NULL, schemaVersion INTEGER NOT NULL DEFAULT 1,
  planExerciseId TEXT NOT NULL REFERENCES fitness_workout_exercise(id), sessionId TEXT NOT NULL REFERENCES fitness_session(id),
  payload TEXT NOT NULL CHECK(json_valid(payload)), status TEXT NOT NULL CHECK(status IN('pending','accepted','dismissed')),
  createdAt TEXT NOT NULL, reviewedAt TEXT, UNIQUE(provider,planExerciseId,sessionId)
);
