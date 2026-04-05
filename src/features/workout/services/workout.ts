import { api } from '@shared/services/api/httpClient';
import { StorageService } from '@shared/services/storage/asyncStorage';
import {
  CompletedWorkout,
  Program,
  ProgramExerciseSpec,
  StatsSnapshot,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
} from '@features/workout/types/Workout';

// ---------------------------------------------------------------------------
// Backend REST shapes (mirrors huginn-external workout types).
// Declared locally because ../types is frozen and these are only used to
// bridge REST payloads to the mobile-local types the screens/stores consume.
// ---------------------------------------------------------------------------
interface BackendProgramExercise {
  id: number;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string | null;
  sets: string | null;
  reps: string | null;
  weight: string | null;
  notes: string | null;
  sortOrder: number;
}

interface BackendProgram {
  id: number;
  name: string;
  description: string | null;
  createdDate: string | null;
  lastModifiedDate: string | null;
  exercises: BackendProgramExercise[];
}

interface BackendProgramExerciseInput {
  exerciseId?: string | null;
  exerciseName: string;
  muscleGroup?: string | null;
  sets?: string | null;
  reps?: string | null;
  weight?: string | null;
  notes?: string | null;
}

interface BackendProgramInput {
  name: string;
  description?: string | null;
  exercises: BackendProgramExerciseInput[];
}

interface BackendWorkoutSet {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
}

interface BackendWorkoutExercise {
  id: number;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string | null;
  sortOrder: number;
  sets: BackendWorkoutSet[];
}

interface BackendHistorySummary {
  id: number;
  programId: number | null;
  programName: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  activeDurationMs: number;
  duration: number;
  activeDuration: number;
  completionPercentage: number;
  totalSetsCompleted: number;
  totalSetsPlanned: number;
  totalVolume: number;
  notes: string | null;
  sourceName: string | null;
}

interface BackendHistoryDetail extends BackendHistorySummary {
  exercises: BackendWorkoutExercise[];
}

interface BackendCompletedWorkoutInput {
  programId?: number | null;
  programName: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  activeDurationMs: number;
  completionPercentage: number;
  totalSetsCompleted: number;
  totalSetsPlanned: number;
  totalVolume: number;
  notes?: string | null;
  exercises: Array<{
    exerciseId?: string | null;
    exerciseName: string;
    muscleGroup?: string | null;
    sortOrder?: number | null;
    sets: BackendWorkoutSet[];
  }>;
}

interface BackendStatsSnapshot {
  id: number;
  createdAt: string;
  heightCm: number | null;
  bodyWeightKg: number;
  measurements: Record<string, number> | null;
  note: string | null;
}

interface BackendStatsInput {
  bodyWeightKg: number;
  heightCm?: number | null;
  measurements?: Record<string, number> | null;
  note?: string | null;
}

export interface WorkoutSummary {
  totalPrograms: number;
  totalCompletedWorkouts: number;
  totalWorkoutNotes: number;
  totalSetsCompleted: number;
  totalVolume: number;
  lastWorkoutAt: string | null;
}

export interface WorkoutNote {
  id: number;
  title: string;
  content: string;
  sourceName: string | null;
  sourcePath: string | null;
  kind: 'text' | 'markdown';
  useAsContext: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutNoteInput {
  title: string;
  content: string;
  sourceName?: string | null;
  sourcePath?: string | null;
  kind?: 'text' | 'markdown';
  useAsContext?: boolean;
}

// ---------------------------------------------------------------------------
// Mappers: backend <-> mobile-local types
// ---------------------------------------------------------------------------
function toMobileProgram(p: BackendProgram): Program {
  return {
    id: p.id,
    name: p.name,
    exercises: p.exercises.map<ProgramExerciseSpec>((e) => ({
      exerciseId: Number(e.exerciseId) || 0,
      exerciseName: e.exerciseName,
      muscleGroup: e.muscleGroup,
      sets: e.sets != null ? Number(e.sets) : null,
      reps: e.reps != null ? Number(e.reps) : null,
      weight: e.weight,
      notes: e.notes,
    })),
  };
}

function toBackendProgramInput(p: Program): BackendProgramInput {
  return {
    name: p.name,
    description: null,
    exercises: p.exercises.map<BackendProgramExerciseInput>((e) => ({
      exerciseId: e.exerciseId != null ? String(e.exerciseId) : null,
      exerciseName: e.exerciseName,
      muscleGroup: e.muscleGroup ?? null,
      sets: e.sets != null ? String(e.sets) : null,
      reps: e.reps != null ? String(e.reps) : null,
      weight: e.weight ?? null,
      notes: e.notes ?? null,
    })),
  };
}

function toMobileWorkoutExercise(e: BackendWorkoutExercise): WorkoutExercise {
  return {
    exerciseId: Number(e.exerciseId) || 0,
    exerciseName: e.exerciseName,
    muscleGroup: e.muscleGroup,
    sets: e.sets.map<WorkoutSet>((s) => ({
      setNumber: s.setNumber,
      reps: s.reps,
      weight: s.weight,
      completed: s.completed,
    })),
  };
}

function toMobileCompletedWorkout(h: BackendHistoryDetail): CompletedWorkout {
  return {
    id: h.id,
    programId: h.programId,
    programName: h.programName,
    startTime: h.startTime,
    endTime: h.endTime,
    durationMs: h.durationMs,
    activeDurationMs: h.activeDurationMs,
    exercises: h.exercises.map(toMobileWorkoutExercise),
    notes: h.notes,
    completionPercentage: h.completionPercentage,
    totalSetsCompleted: h.totalSetsCompleted,
    totalSetsPlanned: h.totalSetsPlanned,
    totalVolume: h.totalVolume,
  };
}

function summaryToCompletedWorkout(s: BackendHistorySummary): CompletedWorkout {
  // History list endpoint returns summaries without exercises.
  // Screens/stores expect CompletedWorkout[]; fill exercises with [].
  return {
    id: s.id,
    programId: s.programId,
    programName: s.programName,
    startTime: s.startTime,
    endTime: s.endTime,
    durationMs: s.durationMs,
    activeDurationMs: s.activeDurationMs,
    exercises: [],
    notes: s.notes,
    completionPercentage: s.completionPercentage,
    totalSetsCompleted: s.totalSetsCompleted,
    totalSetsPlanned: s.totalSetsPlanned,
    totalVolume: s.totalVolume,
  };
}

function toBackendCompletedWorkoutInput(
  w: CompletedWorkout,
): BackendCompletedWorkoutInput {
  return {
    programId: w.programId ?? null,
    programName: w.programName ?? '',
    startTime: w.startTime,
    endTime: w.endTime,
    durationMs: w.durationMs,
    activeDurationMs: w.activeDurationMs,
    completionPercentage: w.completionPercentage,
    totalSetsCompleted: w.totalSetsCompleted,
    totalSetsPlanned: w.totalSetsPlanned,
    totalVolume: w.totalVolume,
    notes: w.notes ?? null,
    exercises: w.exercises.map((e, idx) => ({
      exerciseId: e.exerciseId != null ? String(e.exerciseId) : null,
      exerciseName: e.exerciseName,
      muscleGroup: e.muscleGroup ?? null,
      sortOrder: idx,
      sets: e.sets.map((s) => ({
        setNumber: s.setNumber,
        reps: s.reps,
        weight: s.weight,
        completed: s.completed,
      })),
    })),
  };
}

function toMobileStats(s: BackendStatsSnapshot): StatsSnapshot {
  return {
    id: s.id,
    createdAt: s.createdAt,
    bodyWeightKg: s.bodyWeightKg,
    heightCm: s.heightCm ?? undefined,
    measurements: s.measurements ?? {},
    note: s.note,
  };
}

function toBackendStatsInput(s: StatsSnapshot): BackendStatsInput {
  return {
    bodyWeightKg: s.bodyWeightKg,
    heightCm: s.heightCm ?? null,
    measurements: s.measurements ?? null,
    note: s.note ?? null,
  };
}

// ---------------------------------------------------------------------------
// Local-only storage (active session).
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
  activeSession: 'workout_active_session',
};

// ---------------------------------------------------------------------------
// workoutService — REST-backed, talks to huginn-external /api/workout/*
// ---------------------------------------------------------------------------
export const workoutService = {
  // Summary
  async getSummary(): Promise<WorkoutSummary> {
    return api.get<WorkoutSummary>('/api/workout/summary');
  },

  // Active session (local-only)
  async saveActiveSession(session: WorkoutSession): Promise<void> {
    await StorageService.setItem(STORAGE_KEYS.activeSession, session);
  },
  async getActiveSession(): Promise<WorkoutSession | null> {
    return (await StorageService.getItem<WorkoutSession>(STORAGE_KEYS.activeSession)) || null;
  },
  async clearActiveSession(): Promise<void> {
    await StorageService.removeItem(STORAGE_KEYS.activeSession);
  },

  // Programs
  async getPrograms(): Promise<Program[]> {
    try {
      const list = await api.get<BackendProgram[]>('/api/workout/programs');
      return list.map(toMobileProgram);
    } catch {
      return [];
    }
  },
  async createProgram(program: Program): Promise<Program> {
    const created = await api.post<BackendProgram>(
      '/api/workout/programs',
      toBackendProgramInput(program),
    );
    return toMobileProgram(created);
  },
  async updateProgram(id: number, program: Program): Promise<Program> {
    const updated = await api.put<BackendProgram>(
      `/api/workout/programs/${id}`,
      toBackendProgramInput(program),
    );
    return toMobileProgram(updated);
  },
  /**
   * Preserved for existing callers: upsert a program. Routes to create when
   * id is falsy/zero, update otherwise.
   */
  async saveProgram(program: Program): Promise<void> {
    if (program.id && program.id > 0) {
      await api.put<BackendProgram>(
        `/api/workout/programs/${program.id}`,
        toBackendProgramInput(program),
      );
    } else {
      await api.post<BackendProgram>(
        '/api/workout/programs',
        toBackendProgramInput(program),
      );
    }
  },
  async deleteProgram(programId: number): Promise<void> {
    await api.delete<{ id: number }>(`/api/workout/programs/${programId}`);
  },

  // Workout history
  async getHistory(): Promise<CompletedWorkout[]> {
    try {
      const list = await api.get<BackendHistorySummary[]>('/api/workout/workouts');
      return list.map(summaryToCompletedWorkout);
    } catch {
      return [];
    }
  },
  /** Alias preserved for existing callers. */
  async getWorkoutHistory(): Promise<CompletedWorkout[]> {
    return this.getHistory();
  },
  async getWorkoutDetail(id: number): Promise<CompletedWorkout> {
    const detail = await api.get<BackendHistoryDetail>(`/api/workout/workouts/${id}`);
    return toMobileCompletedWorkout(detail);
  },
  async saveCompletedWorkout(workout: CompletedWorkout): Promise<void> {
    await api.post<BackendHistoryDetail>(
      '/api/workout/workouts',
      toBackendCompletedWorkoutInput(workout),
    );
  },
  async deleteWorkout(workoutId: number): Promise<void> {
    await api.delete<{ id: number }>(`/api/workout/workouts/${workoutId}`);
  },

  // Stats
  async getStats(): Promise<StatsSnapshot[]> {
    try {
      const list = await api.get<BackendStatsSnapshot[]>('/api/workout/stats');
      return list.map(toMobileStats);
    } catch {
      return [];
    }
  },
  /** Alias preserved for existing callers. */
  async getStatsSnapshots(): Promise<StatsSnapshot[]> {
    return this.getStats();
  },
  async saveStats(snapshot: StatsSnapshot): Promise<StatsSnapshot> {
    const created = await api.post<BackendStatsSnapshot>(
      '/api/workout/stats',
      toBackendStatsInput(snapshot),
    );
    return toMobileStats(created);
  },
  /** Alias preserved for existing callers. */
  async saveStatsSnapshot(snapshot: StatsSnapshot): Promise<void> {
    await api.post<BackendStatsSnapshot>(
      '/api/workout/stats',
      toBackendStatsInput(snapshot),
    );
  },
  async deleteStats(id: number): Promise<void> {
    await api.delete<{ id: number }>(`/api/workout/stats/${id}`);
  },

  // Notes
  async getNotes(): Promise<WorkoutNote[]> {
    return api.get<WorkoutNote[]>('/api/workout/notes');
  },
  async createNote(input: WorkoutNoteInput): Promise<WorkoutNote> {
    return api.post<WorkoutNote>('/api/workout/notes', input);
  },
  async updateNote(id: number, input: WorkoutNoteInput): Promise<WorkoutNote> {
    return api.put<WorkoutNote>(`/api/workout/notes/${id}`, input);
  },
  async deleteNote(id: number): Promise<void> {
    await api.delete<{ id: number }>(`/api/workout/notes/${id}`);
  },
};
