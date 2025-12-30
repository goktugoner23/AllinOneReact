# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
npm run android          # Run on Android
npm run ios              # Run on iOS
npm start                # Start Metro bundler
npm start -- --reset-cache  # Start with cache cleared

# Quality Checks
npm run lint             # ESLint
npx prettier --check "src/**/*.{ts,tsx}"  # Prettier check
npx prettier --write "src/**/*.{ts,tsx}"  # Prettier fix
npx tsc --noEmit         # TypeScript check

# Testing
npm test                 # Jest tests

# Android Release Build
cd android && ./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

## Architecture Overview

This is a React Native personal finance app with feature-based architecture.

### Project Structure
```
src/
├── features/           # Self-contained feature modules
│   ├── calendar/       # Calendar & events
│   ├── history/        # Transaction history
│   ├── instagram/      # Instagram profiler
│   ├── notes/          # Notes with media & drawing
│   ├── tasks/          # Task management
│   ├── transactions/   # Financial tracking (main feature)
│   ├── workout/        # Workout tracking
│   └── wtregistry/     # Wing Tsun martial arts registry
├── shared/             # Cross-feature utilities
│   ├── components/ui/  # Reusable UI (Card, Button, Input, Select)
│   ├── services/firebase/  # Firebase setup
│   ├── hooks/          # useAppDispatch, useAppSelector, useSafeState
│   ├── lib/            # TanStack Query client setup
│   ├── store/          # Redux store & slices
│   └── utils/          # logger, validation, formatters
└── App.tsx             # Root with navigation setup
```

### Each Feature Follows This Pattern
```
features/featureName/
├── screens/      # Screen components
├── components/   # Feature-specific UI
├── services/     # Firebase/API operations
├── hooks/        # Feature query hooks
├── store/        # Redux slice (if needed)
└── types/        # TypeScript types
```

### State Management (Hybrid Approach)

**TanStack Query** - Server state & data fetching:
- Query hooks in `shared/hooks/` (useTransactionsQueries, useCalendarQueries, etc.)
- Query key factory in `shared/lib/queryClient.ts`
- 5-min stale time, 30-min cache

**Redux Toolkit** - Client/UI state:
- Slices in `shared/store/` (balanceSlice, calendarSlice, etc.)
- Typed hooks: `useAppDispatch()`, `useAppSelector()`

### Navigation Structure

Drawer Navigator (main) containing:
- **Transactions Dashboard** (Tab Navigator): Home, Investments, Reports
- **Notes** (Stack): NotesScreen → EditNoteScreen
- **Tasks**, **Calendar**, **History**, **WT Registry**
- **Instagram** (Tab Navigator with multiple tabs)
- **Workout** (Stack): WorkoutTabs → StopwatchScreen

### Key Technologies

| Purpose | Library |
|---------|---------|
| UI Components | React Native Paper (Material Design) |
| Styling | NativeWind (Tailwind CSS) |
| Lists | FlashList (@shopify/flash-list) |
| Drawing | React Native Skia (GPU-accelerated) |
| Animations | React Native Reanimated |
| Gestures | React Native Gesture Handler |

### Path Aliases
```typescript
@features/*  → src/features/*
@shared/*    → src/shared/*
@theme       → src/theme
@App         → App.tsx
```

### Firebase Collections
- `transactions`, `investments` - Financial data
- `events` - Calendar events
- `notes`, `tasks`, `taskGroups` - Notes & tasks
- `students`, `registrations`, `wtLessons`, `seminars` - WT Registry
- `workouts` - Workout sessions
- `transactions_meta` - Aggregate totals for fast balance queries

### External APIs (via Node.js proxy)
- **Binance**: USD-M/COIN-M futures data via `API_BASE_URL_DEV`/`API_BASE_URL_PROD`
- **Instagram**: Profile, stories, posts via same proxy

## Important Patterns

### Adding a New Screen
1. Create screen in `features/featureName/screens/`
2. Add to navigation in `App.tsx`
3. Create service functions in `services/`
4. Add TanStack Query hook in `hooks/` or `shared/hooks/`

### Firebase Operations
- Use `getDb()` from `@shared/services/firebase/firebase`
- Sequential IDs via `firebaseIdManager.getNextId('collectionName')`
- File uploads use `ReactNativeBlobUtil`

### Shared UI Components
Located in `shared/components/ui/`:
- `Card`, `CardHeader`, `CardContent` - Container with elevation
- `Button` - Primary, secondary, destructive variants
- `Input` - Text input with label
- `Select` - Dropdown with search

### Theme
- Light/dark mode via React Native Paper
- Theme colors in `src/theme.ts`
- Primary purple: `#7C3AED`

## Cursor Rules Reference

Detailed guidelines are in `.cursor/rules/`:
- `react-native-guidelines.mdc` - Performance, components
- `typescript-guidelines.mdc` - Type safety
- `firebase-guidelines.mdc` - Firestore patterns
- `state-management-guidelines.mdc` - Redux + TanStack Query
- `component-guidelines.mdc` - UI architecture
