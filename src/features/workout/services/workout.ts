import { collection, doc, getDocs, setDoc, orderBy, query, Timestamp } from 'firebase/firestore';
import { getDb } from '@shared/services/firebase/firebase';
import { firebaseIdManager } from '@shared/services/firebase/firebaseIdManager';
import { StorageService } from '@shared/services/storage/asyncStorage';
import { CompletedWorkout, Program, ProgramExerciseSpec, StatsSnapshot, WorkoutExercise, WorkoutSession } from '@features/workout/types/Workout';

const COLLECTIONS = {
  workouts: 'workouts',
  programs: 'programs',
  stats: 'stats',
};

const STORAGE_KEYS = {
  activeSession: 'workout_active_session',
};

export const workoutService = {
  async getPrograms(): Promise<Program[]> {
    try {
      const q = query(collection(getDb(), COLLECTIONS.programs), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: Number(data.id ?? d.id),
          name: String(data.name ?? ''),
          exercises: (data.exercises || []).map((e: any) => ({
            exerciseId: Number(e.exerciseId),
            exerciseName: String(e.exerciseName),
            muscleGroup: e.muscleGroup ?? null,
            sets: Number(e.sets ?? 0),
            reps: Number(e.reps ?? 0),
            weight: Number(e.weight ?? 0),
            notes: e.notes ?? null,
          })) as ProgramExerciseSpec[],
        } as Program;
      });
    } catch {
      return [];
    }
  },

  async saveActiveSession(session: WorkoutSession): Promise<void> {
    await StorageService.setItem(STORAGE_KEYS.activeSession, session);
  },
  async getActiveSession(): Promise<WorkoutSession | null> {
    return (await StorageService.getItem<WorkoutSession>(STORAGE_KEYS.activeSession)) || null;
  },
  async clearActiveSession(): Promise<void> {
    await StorageService.removeItem(STORAGE_KEYS.activeSession);
  },

  async saveCompletedWorkout(workout: CompletedWorkout): Promise<void> {
    const id = workout.id || (await firebaseIdManager.getNextId('workouts'));
    const docRef = doc(getDb(), COLLECTIONS.workouts, id.toString());
    await setDoc(docRef, {
      ...workout,
      id,
      duration: workout.durationMs,
      activeDuration: workout.activeDurationMs,
      startTime: Timestamp.fromDate(new Date(workout.startTime)),
      endTime: Timestamp.fromDate(new Date(workout.endTime)),
      createdAt: Timestamp.now(),
    });
  },
  async getWorkoutHistory(): Promise<CompletedWorkout[]> {
    try {
      const q = query(collection(getDb(), COLLECTIONS.workouts), orderBy('endTime', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: Number(data.id ?? d.id),
          programId: data.programId ?? null,
          programName: data.programName ?? null,
          startTime: (data.startTime?.toDate?.() ?? new Date()).toISOString(),
          endTime: (data.endTime?.toDate?.() ?? new Date()).toISOString(),
          durationMs: Number(data.duration ?? 0),
          activeDurationMs: Number(data.activeDuration ?? 0),
          exercises: (data.exercises || []) as WorkoutExercise[],
          notes: data.notes ?? null,
          completionPercentage: Number(data.completionPercentage ?? 0),
          totalSetsCompleted: Number(data.totalSetsCompleted ?? 0),
          totalSetsPlanned: Number(data.totalSetsPlanned ?? 0),
          totalVolume: Number(data.totalVolume ?? 0),
        } as CompletedWorkout;
      });
    } catch {
      return [];
    }
  },

  async saveStatsSnapshot(snapshot: StatsSnapshot): Promise<void> {
    const id = await firebaseIdManager.getNextId('stats');
    const docRef = doc(getDb(), COLLECTIONS.stats, id.toString());
    await setDoc(docRef, {
      id,
      createdAt: Timestamp.now(),
      bodyWeightKg: snapshot.bodyWeightKg,
      measurements: snapshot.measurements,
      note: snapshot.note ?? null,
    });
  },
  async getStatsSnapshots(): Promise<StatsSnapshot[]> {
    try {
      const q = query(collection(getDb(), COLLECTIONS.stats), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: Number(data.id ?? d.id),
          createdAt: (data.createdAt?.toDate?.() ?? new Date()).toISOString(),
          bodyWeightKg: Number(data.bodyWeightKg ?? 0),
          measurements: data.measurements || {},
          note: data.note ?? null,
        } as StatsSnapshot;
      });
    } catch {
      return [];
    }
  },
};


