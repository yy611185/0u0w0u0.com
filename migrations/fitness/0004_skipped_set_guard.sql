DROP TRIGGER fitness_set_update_guard;
CREATE TRIGGER fitness_set_update_guard BEFORE UPDATE ON fitness_exercise_set BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM fitness_session_exercise e JOIN fitness_session s ON s.id=e.sessionId
    WHERE e.id=NEW.sessionExerciseId AND s.id=NEW.sessionId AND s.status='active' AND e.skipped=0
  ) THEN RAISE(ABORT,'fitness_conflict') END);
END;
