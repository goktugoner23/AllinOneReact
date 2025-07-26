import { configureStore } from '@reduxjs/toolkit';
import wtRegistryReducer from './wtRegistrySlice';
import calendarReducer from './calendarSlice';

const store = configureStore({
  reducer: {
    wtRegistry: wtRegistryReducer,
    calendar: calendarReducer,
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