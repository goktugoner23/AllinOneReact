// Shared Hooks - Barrel Export

// Tasks TanStack Query hooks
export {
  useTasks,
  useTaskGroups,
  useAddTask,
  useUpdateTask,
  useDeleteTask,
  useToggleTaskCompleted,
  useAddTaskGroup,
  useUpdateTaskGroup,
  useDeleteTaskGroup,
  useGroupedTasks,
} from './useTasksQueries';


// Notes TanStack Query hooks
export { useNotes, useNote, useAddNote, useUpdateNote, useDeleteNote, useSearchNotes } from './useNotesQueries';

// R2 display URL resolver
export { useResolvedUri } from './useResolvedUri';

// Calendar TanStack Query hooks
export {
  useCalendarEvents,
  useEventsForDate,
  useAddCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
  useMarkedDates,
} from './useCalendarQueries';

// Transactions TanStack Query hooks
export {
  useTransactions,
  useBalance,
  useAddTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useInvestments,
  useAddInvestment,
  useUpdateInvestment,
  useDeleteInvestment,
} from './useTransactionsQueries';
