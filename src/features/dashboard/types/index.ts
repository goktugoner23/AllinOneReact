export interface DashboardSnapshot {
  transactions: { todayCount: number; totalCount: number };
  tasks: { incompleteCount: number; dueSoonCount: number };
  notes: { totalCount: number };
  calendar: { upcomingCount: number };
  workout: { totalCompletedWorkouts: number; totalVolume: number };
  wtRegistry: { activeRegistrations: number; activeStudents: number };
  history: { total: number };
}
