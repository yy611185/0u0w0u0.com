-- Finishing the remaining sets of an exercise is explicit; retain every actual recorded set.
DROP TRIGGER fitness_slot_update_guard;
CREATE TRIGGER fitness_slot_update_guard BEFORE UPDATE ON fitness_session_exercise BEGIN
  SELECT (CASE WHEN NOT EXISTS(SELECT 1 FROM fitness_session WHERE id=NEW.sessionId AND status='active')
    OR (NEW.exerciseId<>OLD.exerciseId AND EXISTS(SELECT 1 FROM fitness_exercise_set WHERE sessionExerciseId=NEW.id))
    THEN RAISE(ABORT,'fitness_conflict') END);
END;
