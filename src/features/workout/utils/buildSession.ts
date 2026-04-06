import {
  Program,
  ProgramExerciseSpec,
  SessionExercise,
  TargetSet,
  WorkoutSession,
} from '@features/workout/types/Workout';

export function buildSessionFromProgram(id: number, program?: Program): WorkoutSession {
  const exercises: SessionExercise[] = (program?.exercises || []).map((spec: ProgramExerciseSpec) => {
    const setsCount: number = (() => {
      const n = Number(spec.sets ?? 0);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    })();
    const targetReps: number = (() => {
      const n = Number(spec.reps ?? 0);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    })();
    const targetWeightFromSpec = () => {
      if (spec.weight == null) return 0;
      const n = Number(spec.weight);
      return isNaN(n) ? 0 : n;
    };

    const sets: TargetSet[] = Array.from({ length: setsCount }).map((_, idx) => ({
      setNumber: idx + 1,
      targetReps,
      targetWeight: targetWeightFromSpec(),
      restTime: 0,
    }));
    return {
      exerciseId: spec.exerciseId,
      exerciseName: spec.exerciseName,
      muscleGroup: spec.muscleGroup ?? null,
      targetSets: sets,
      completedSets: [],
      isCompleted: false,
      notes: spec.notes ?? null,
    };
  });

  return {
    id,
    programId: program?.id ?? null,
    programName: program?.name ?? null,
    startTime: new Date().toISOString(),
    pausedDurationMs: 0,
    exercises,
    isActive: true,
    notes: null,
  };
}
