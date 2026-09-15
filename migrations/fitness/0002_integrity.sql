-- Guards run inside the write transaction, including concurrent requests from another device.
CREATE TRIGGER fitness_set_insert_guard BEFORE INSERT ON fitness_exercise_set BEGIN
  SELECT (CASE WHEN NOT EXISTS (
    SELECT 1 FROM fitness_session_exercise e JOIN fitness_session s ON s.id=e.sessionId
    WHERE e.id=NEW.sessionExerciseId AND s.id=NEW.sessionId AND s.status='active'
      AND e.exerciseId=NEW.exerciseId AND e.skipped=0 AND NEW.setNumber<=e.sets
  ) THEN RAISE(ABORT,'fitness_conflict') END);
END;
CREATE TRIGGER fitness_set_update_guard BEFORE UPDATE ON fitness_exercise_set BEGIN
  SELECT (CASE WHEN NOT EXISTS (SELECT 1 FROM fitness_session WHERE id=NEW.sessionId AND status='active')
    THEN RAISE(ABORT,'fitness_conflict') END);
END;
CREATE TRIGGER fitness_slot_update_guard BEFORE UPDATE ON fitness_session_exercise BEGIN
  SELECT (CASE WHEN NOT EXISTS(SELECT 1 FROM fitness_session WHERE id=NEW.sessionId AND status='active')
    OR EXISTS(SELECT 1 FROM fitness_exercise_set WHERE sessionExerciseId=NEW.id)
    THEN RAISE(ABORT,'fitness_conflict') END);
END;
CREATE TRIGGER fitness_finish_guard BEFORE UPDATE OF status ON fitness_session
WHEN NEW.status='completed' AND OLD.status='active' BEGIN
  SELECT (CASE WHEN NOT EXISTS(SELECT 1 FROM fitness_exercise_set WHERE sessionId=NEW.id AND completed=1)
    OR EXISTS(SELECT 1 FROM fitness_session_exercise e WHERE e.sessionId=NEW.id AND e.skipped=0
      AND (SELECT COUNT(*) FROM fitness_exercise_set x WHERE x.sessionExerciseId=e.id AND x.completed=1)<e.sets)
    THEN RAISE(ABORT,'fitness_incomplete') END);
END;
