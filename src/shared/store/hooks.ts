import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';
import { useState, useEffect, useRef, useCallback } from 'react';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Custom hook for async operations with proper typing
export const useAsyncOperation = <T>(asyncFunction: () => Promise<T>, dependencies: any[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  return { data, loading, error, execute };
};

// Custom hook to prevent state updates on unmounted components
export const useSafeState = <T>(initialValue: T) => {
  const [value, setValue] = useState(initialValue);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetValue = useCallback((newValue: T | ((prev: T) => T)) => {
    if (isMountedRef.current) {
      setValue(newValue);
    }
  }, []);

  return [value, safeSetValue] as const;
};
