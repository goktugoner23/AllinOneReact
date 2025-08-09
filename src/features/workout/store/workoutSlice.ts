import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { firebaseIdManager } from '@shared/services/firebase/firebaseIdManager';
import { workoutService } from '@features/workout/services/workout';
import {
  CompletedSet,
  CompletedWorkout,
  Program,
  ProgramExerciseSpec,
  SessionExercise,
  TargetSet,
  WorkoutExercise,
  WorkoutSession,
  calculateCompletionPercentage,
} from '@features/workout/types/Workout';

type StopwatchState = {
  startTimeMs: number | null;
  elapsedMs: number;
  isRunning: boolean;
  isPaused: boolean;
  totalPausedMs: number;
  pauseStartedAtMs: number | null;
};

interface WorkoutState {
  activeSession: WorkoutSession | null;
  stopwatch: StopwatchState;
  isLoading: boolean;
  error: string | null;
  history: CompletedWorkout[];
}

const initialState: WorkoutState = {
  activeSession: null,
  stopwatch: {
    startTimeMs: null,
    elapsedMs: 0,
    isRunning: false,
    isPaused: false,
    totalPausedMs: 0,
    pauseStartedAtMs: null,
  },
  isLoading: false,
  error: null,
  history: [],
};

const now = () => Date.now();
const isoNow = () => new Date().toISOString();

const buildSessionFromProgram = (id: number, program?: Program): WorkoutSession => {
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
    startTime: isoNow(),
    pausedDurationMs: 0,
    exercises,
    isActive: true,
    notes: null,
  };
};

export const initializeSession = createAsyncThunk('workout/initialize', async () => {
  return await workoutService.getActiveSession();
});

export const startWorkout = createAsyncThunk('workout/start', async (program?: Program) => {
  const id = await firebaseIdManager.getNextId('workouts');
  const session = buildSessionFromProgram(id, program);
  await workoutService.saveActiveSession(session);
  return session;
});

export const saveProgress = createAsyncThunk('workout/saveProgress', async (_, { getState }) => {
  const state = getState() as { workout: WorkoutState };
  const session = state.workout.activeSession;
  if (session) await workoutService.saveActiveSession(session);
});

export const finishWorkout = createAsyncThunk('workout/finish', async (notes: string | undefined, { getState }) => {
  const state = getState() as { workout: WorkoutState };
  const { activeSession, stopwatch } = state.workout;
  if (!activeSession) throw new Error('No active session');
  const endTime = isoNow();
  const totalMs = stopwatch.elapsedMs;
  const activeMs = Math.max(0, totalMs - stopwatch.totalPausedMs);
  const exercises: WorkoutExercise[] = activeSession.exercises.map((ex) => ({
    exerciseId: ex.exerciseId,
    exerciseName: ex.exerciseName,
    muscleGroup: ex.muscleGroup ?? null,
    sets: ex.completedSets.map((cs) => ({ setNumber: cs.setNumber, reps: cs.actualReps, weight: cs.actualWeight, completed: true })),
  }));
  const totalVolume = activeSession.exercises.reduce((sum, e) => sum + e.completedSets.reduce((s, c) => s + c.actualWeight * c.actualReps, 0), 0);
  const completed: CompletedWorkout = {
    id: activeSession.id,
    programId: activeSession.programId ?? null,
    programName: activeSession.programName ?? null,
    startTime: activeSession.startTime,
    endTime,
    durationMs: totalMs,
    activeDurationMs: activeMs,
    exercises,
    notes: notes ?? null,
    completionPercentage: calculateCompletionPercentage(activeSession.exercises),
    totalSetsCompleted: activeSession.exercises.reduce((s, e) => s + e.completedSets.length, 0),
    totalSetsPlanned: activeSession.exercises.reduce((s, e) => s + e.targetSets.length, 0),
    totalVolume,
  };
  await workoutService.saveCompletedWorkout(completed);
  await workoutService.clearActiveSession();
  return completed;
});

export const loadHistory = createAsyncThunk('workout/loadHistory', async () => {
  return await workoutService.getWorkoutHistory();
});

const slice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    startStopwatch: (state) => {
      if (state.stopwatch.isRunning) return;
      state.stopwatch.isRunning = true;
      state.stopwatch.isPaused = false;
      const base = state.stopwatch.elapsedMs > 0 ? now() - state.stopwatch.elapsedMs : now();
      state.stopwatch.startTimeMs = base;
    },
    tick: (state) => {
      if (!state.stopwatch.isRunning || state.stopwatch.isPaused) return;
      if (state.stopwatch.startTimeMs == null) return;
      state.stopwatch.elapsedMs = now() - state.stopwatch.startTimeMs;
    },
    pause: (state) => {
      if (!state.stopwatch.isRunning || state.stopwatch.isPaused) return;
      state.stopwatch.isPaused = true;
      state.stopwatch.pauseStartedAtMs = now();
    },
    resume: (state) => {
      if (!state.stopwatch.isRunning || !state.stopwatch.isPaused) return;
      const pausedFor = state.stopwatch.pauseStartedAtMs ? now() - state.stopwatch.pauseStartedAtMs : 0;
      state.stopwatch.totalPausedMs += pausedFor;
      state.stopwatch.pauseStartedAtMs = null;
      state.stopwatch.isPaused = false;
    },
    reset: (state) => {
      state.stopwatch = { startTimeMs: null, elapsedMs: 0, isRunning: false, isPaused: false, totalPausedMs: 0, pauseStartedAtMs: null };
    },
    completeSet: (state, action: PayloadAction<{ exerciseId: number; setNumber: number; reps?: number; weight?: number }>) => {
      if (!state.activeSession) return;
      const { exerciseId, setNumber, reps = 0, weight = 0 } = action.payload;
      const ex = state.activeSession.exercises.find((e) => e.exerciseId === exerciseId);
      if (!ex || ex.completedSets.some((s) => s.setNumber === setNumber)) return;
      const cs: CompletedSet = { setNumber, actualReps: reps, actualWeight: weight, completedAt: isoNow() };
      ex.completedSets = [...ex.completedSets, cs];
      ex.isCompleted = ex.completedSets.length >= ex.targetSets.length;
    },
    uncompleteSet: (state, action: PayloadAction<{ exerciseId: number; setNumber: number }>) => {
      if (!state.activeSession) return;
      const { exerciseId, setNumber } = action.payload;
      const ex = state.activeSession.exercises.find((e) => e.exerciseId === exerciseId);
      if (!ex) return;
      ex.completedSets = ex.completedSets.filter((s) => s.setNumber !== setNumber);
      ex.isCompleted = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeSession.fulfilled, (state, action) => {
        if (action.payload) state.activeSession = action.payload;
      })
      .addCase(startWorkout.fulfilled, (state, action) => {
        state.activeSession = action.payload;
        state.stopwatch = { startTimeMs: null, elapsedMs: 0, isRunning: false, isPaused: false, totalPausedMs: 0, pauseStartedAtMs: null };
      })
      .addCase(finishWorkout.fulfilled, (state, action) => {
        state.history.unshift(action.payload);
        state.activeSession = null;
        state.stopwatch = { startTimeMs: null, elapsedMs: 0, isRunning: false, isPaused: false, totalPausedMs: 0, pauseStartedAtMs: null };
      })
      .addCase(loadHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });
  },
});

export const { startStopwatch, tick, pause, resume, reset, completeSet, uncompleteSet } = slice.actions;
export default slice.reducer;


