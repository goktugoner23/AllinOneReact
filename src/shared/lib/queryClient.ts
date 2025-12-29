import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query Keys Factory for type-safe query keys
export const queryKeys = {
  // Transactions
  transactions: {
    all: ['transactions'] as const,
    list: () => [...queryKeys.transactions.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.transactions.all, 'detail', id] as const,
    balance: () => [...queryKeys.transactions.all, 'balance'] as const,
  },

  // Investments
  investments: {
    all: ['investments'] as const,
    list: () => [...queryKeys.investments.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.investments.all, 'detail', id] as const,
    binance: () => [...queryKeys.investments.all, 'binance'] as const,
  },

  // Tasks
  tasks: {
    all: ['tasks'] as const,
    list: () => [...queryKeys.tasks.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.tasks.all, 'detail', id] as const,
    groups: () => [...queryKeys.tasks.all, 'groups'] as const,
  },

  // Notes
  notes: {
    all: ['notes'] as const,
    list: () => [...queryKeys.notes.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.notes.all, 'detail', id] as const,
  },

  // Calendar
  calendar: {
    all: ['calendar'] as const,
    events: (month?: string) => [...queryKeys.calendar.all, 'events', month] as const,
  },

  // Instagram
  instagram: {
    all: ['instagram'] as const,
    profile: (username: string) => [...queryKeys.instagram.all, 'profile', username] as const,
    stories: (username: string) => [...queryKeys.instagram.all, 'stories', username] as const,
    posts: (username: string) => [...queryKeys.instagram.all, 'posts', username] as const,
    allData: (username: string) => [...queryKeys.instagram.all, 'allData', username] as const,
  },

  // WT Registry
  wtRegistry: {
    all: ['wtRegistry'] as const,
    students: () => [...queryKeys.wtRegistry.all, 'students'] as const,
    seminars: () => [...queryKeys.wtRegistry.all, 'seminars'] as const,
    lessons: () => [...queryKeys.wtRegistry.all, 'lessons'] as const,
    registrations: () => [...queryKeys.wtRegistry.all, 'registrations'] as const,
  },

  // Workout
  workout: {
    all: ['workout'] as const,
    sessions: () => [...queryKeys.workout.all, 'sessions'] as const,
    detail: (id: string) => [...queryKeys.workout.all, 'detail', id] as const,
  },
};
