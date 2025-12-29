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

// Instagram TanStack Query hooks
export {
  useInstagramAllData,
  useInstagramProfilePicture,
  useInstagramStories,
  useInstagramPosts,
  useInstagramFirestorePosts,
  useInstagramAnalytics,
  useInstagramHealth,
  useRAGQuery,
  useFileAnalysis,
  useInstagramURLAnalysis,
  usePrefetchInstagramData,
} from './useInstagramQueries';

// Notes TanStack Query hooks
export { useNotes, useNote, useAddNote, useUpdateNote, useDeleteNote, useSearchNotes } from './useNotesQueries';

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
