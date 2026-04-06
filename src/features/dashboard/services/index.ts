import { api } from '@shared/services/api/httpClient';
import { DashboardSnapshot } from '../types';

const EMPTY: DashboardSnapshot = {
  transactions: { todayCount: 0, totalCount: 0 },
  tasks: { incompleteCount: 0, dueSoonCount: 0 },
  notes: { totalCount: 0 },
  calendar: { upcomingCount: 0 },
  workout: { totalCompletedWorkouts: 0, totalVolume: 0 },
  wtRegistry: { activeRegistrations: 0, activeStudents: 0 },
  history: { total: 0 },
};

/** Safely fetch and transform, returning fallback on any error. */
async function safe<T, R>(fetcher: () => Promise<T>, transform: (v: T) => R, fallback: R): Promise<R> {
  try {
    return transform(await fetcher());
  } catch {
    return fallback;
  }
}

interface BackendTask {
  id: number;
  completed: boolean;
  due_date: string | null;
}

interface BackendTransaction {
  id: number;
  date: string;
}

interface BackendNote {
  id: number;
}

interface BackendEvent {
  id: number;
  date: string;
}

interface WorkoutSummary {
  totalCompletedWorkouts: number;
  totalVolume: number;
}

interface BackendStudent {
  id: number;
  isActive: boolean;
}

interface BackendRegistration {
  id: number;
  endDate: string;
}

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();

  const [transactions, tasks, notes, calendar, workout, students, registrations] =
    await Promise.all([
      safe(
        () => api.get<BackendTransaction[]>('/api/transactions', { searchParams: { limit: 500 } }),
        (rows) => ({
          todayCount: (rows ?? []).filter((t) => t.date?.slice(0, 10) === todayStr).length,
          totalCount: (rows ?? []).length,
        }),
        EMPTY.transactions,
      ),
      safe(
        () => api.get<BackendTask[]>('/api/tasks'),
        (rows) => {
          const incomplete = (rows ?? []).filter((t) => !t.completed);
          const dueSoon = incomplete.filter(
            (t) => t.due_date && new Date(t.due_date).getTime() - nowMs < threeDaysMs && new Date(t.due_date).getTime() >= nowMs,
          );
          return { incompleteCount: incomplete.length, dueSoonCount: dueSoon.length };
        },
        EMPTY.tasks,
      ),
      safe(
        () => api.get<BackendNote[]>('/api/notes'),
        (rows) => ({ totalCount: (rows ?? []).length }),
        EMPTY.notes,
      ),
      safe(
        () => api.get<BackendEvent[]>('/api/calendar'),
        (rows) => ({
          upcomingCount: (rows ?? []).filter((e) => new Date(e.date).getTime() >= nowMs).length,
        }),
        EMPTY.calendar,
      ),
      safe(
        () => api.get<WorkoutSummary>('/api/workout/summary'),
        (s) => ({
          totalCompletedWorkouts: s?.totalCompletedWorkouts ?? 0,
          totalVolume: s?.totalVolume ?? 0,
        }),
        EMPTY.workout,
      ),
      safe(
        () => api.get<BackendStudent[]>('/api/wtregistry/students'),
        (rows) => (rows ?? []).filter((s) => s.isActive),
        [] as BackendStudent[],
      ),
      safe(
        () => api.get<BackendRegistration[]>('/api/wtregistry/registrations'),
        (rows) => (rows ?? []).filter((r) => new Date(r.endDate).getTime() >= nowMs),
        [] as BackendRegistration[],
      ),
    ]);

  // History total = transactions total (history screen aggregates transactions + investments + registrations)
  const historyTotal = transactions.totalCount;

  return {
    transactions,
    tasks,
    notes,
    calendar,
    workout,
    wtRegistry: {
      activeStudents: students.length,
      activeRegistrations: registrations.length,
    },
    history: { total: historyTotal },
  };
}
