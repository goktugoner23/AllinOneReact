import { configureStore } from '@reduxjs/toolkit';
import wtRegistryReducer from '@features/wtregistry/store/wtRegistrySlice';
import calendarReducer from '@features/calendar/store/calendarSlice';
import balanceReducer from '@features/transactions/store/balanceSlice';
import notesReducer from '@features/notes/store/notesSlice';
import tasksReducer from '@features/tasks/store/tasksSlice';
import instagramReducer from '@features/instagram/store/instagramSlice';
import workoutReducer from '@features/workout/store/workoutSlice';

const store = configureStore({
  reducer: {
    wtRegistry: wtRegistryReducer,
    calendar: calendarReducer,
    balance: balanceReducer,
    notes: notesReducer,
    tasks: tasksReducer,
    instagram: instagramReducer,
    workout: workoutReducer,
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
