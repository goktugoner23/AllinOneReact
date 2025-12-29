export interface TargetSet {
  setNumber: number;
  targetReps: number;
  targetWeight: number;
  restTime?: number;
}

export interface CompletedSet {
  setNumber: number;
  actualReps: number;
  actualWeight: number;
  completedAt: string;
  restTime?: number;
}

export interface SessionExercise {
  exerciseId: number;
  exerciseName: string;
  muscleGroup?: string | null;
  targetSets: TargetSet[];
  completedSets: CompletedSet[];
  isCompleted: boolean;
  notes?: string | null;
}

export interface WorkoutSession {
  id: number;
  programId?: number | null;
  programName?: string | null;
  startTime: string;
  pausedDurationMs: number;
  exercises: SessionExercise[];
  isActive: boolean;
  notes?: string | null;
}

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutExercise {
  exerciseId: number;
  exerciseName: string;
  muscleGroup?: string | null;
  sets: WorkoutSet[];
}

export interface CompletedWorkout {
  id: number;
  programId?: number | null;
  programName?: string | null;
  startTime: string;
  endTime: string;
  durationMs: number;
  activeDurationMs: number;
  exercises: WorkoutExercise[];
  notes?: string | null;
  completionPercentage: number;
  totalSetsCompleted: number;
  totalSetsPlanned: number;
  totalVolume: number;
}

export interface ProgramExerciseSpec {
  exerciseId: number;
  exerciseName: string;
  muscleGroup?: string | null;
  sets?: number | null;
  reps?: number | null;
  weight?: string | null; // allow text like "bodyweight"
  notes?: string | null;
}

export interface Program {
  id: number;
  name: string;
  exercises: ProgramExerciseSpec[];
}

export const calculateCompletionPercentage = (exercises: SessionExercise[]): number => {
  const totalSets = exercises.reduce((sum, e) => sum + e.targetSets.length, 0);
  const completedSets = exercises.reduce((sum, e) => sum + e.completedSets.length, 0);
  if (totalSets === 0) return 0;
  return (completedSets / totalSets) * 100;
};

export interface StatsSnapshot {
  id?: number;
  createdAt?: string;
  bodyWeightKg: number;
  heightCm?: number;
  measurements: Record<string, number>;
  note?: string | null;
}
