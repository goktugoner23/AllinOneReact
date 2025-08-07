import { configureStore } from '@reduxjs/toolkit';
import wtRegistryReducer from './wtRegistrySlice';
import calendarReducer from './calendarSlice';
import balanceReducer from './balanceSlice';
import notesReducer from './notesSlice';
import tasksReducer from './tasksSlice';

const store = configureStore({
  reducer: {
    wtRegistry: wtRegistryReducer,
    calendar: calendarReducer,
    balance: balanceReducer,
    notes: notesReducer,
    tasks: tasksReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['_persist'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store; 