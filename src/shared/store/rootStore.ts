import { configureStore } from '@reduxjs/toolkit';
import wtRegistryReducer from '@features/wtregistry/store/wtRegistrySlice';
import calendarReducer from '@features/calendar/store/calendarSlice';
import balanceReducer from '@features/transactions/store/balanceSlice';
import tasksReducer from '@features/tasks/store/tasksSlice';
import workoutReducer from '@features/workout/store/workoutSlice';
import muninnReducer from '@features/muninn/store/muninnSlice';

const store = configureStore({
  reducer: {
    wtRegistry: wtRegistryReducer,
    calendar: calendarReducer,
    balance: balanceReducer,
    tasks: tasksReducer,
    workout: workoutReducer,
    muninn: muninnReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['_persist'],
      },
      immutableCheck: false,
    }),
  devTools: __DEV__,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
