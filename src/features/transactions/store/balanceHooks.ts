import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store/rootStore';
import {
  loadCachedBalance,
  calculateBalance,
  updateBalanceIncrementally,
  setStale,
  invalidateBalanceCache,
  forceInvalidateCache,
} from '@features/transactions/store/balanceSlice';

export const useBalance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const balance = useSelector((state: RootState) => state.balance);

  // Initialize balance on mount with eager loading
  useEffect(() => {
    const initializeBalance = async () => {
      // First, try to load from cache (fast)
      const cachedResult = await dispatch(loadCachedBalance());

      // Only calculate fresh balance if no cache or cache is stale
      if (!cachedResult.payload || cachedResult.payload.isStale) {
        // Add a small delay to prevent rapid successive calls
        setTimeout(() => {
          dispatch(calculateBalance());
        }, 100);
      }
    };

    initializeBalance();
  }, [dispatch]);

  // Function to refresh balance (force recalculation) with debouncing
  const refreshBalance = useCallback(() => {
    // Clear any pending timeout to prevent multiple rapid calls
    if ((refreshBalance as any).timeoutId) {
      clearTimeout((refreshBalance as any).timeoutId);
    }

    // Set a new timeout to debounce the call
    (refreshBalance as any).timeoutId = setTimeout(() => {
      dispatch(calculateBalance());
    }, 200);
  }, [dispatch]);

  // Function to force refresh balance by invalidating cache first
  const forceRefreshBalance = useCallback(async () => {
    try {
      // First invalidate the cache
      await dispatch(invalidateBalanceCache());
      // Then force a fresh calculation
      dispatch(calculateBalance());
    } catch (error) {
      console.error('Error force refreshing balance:', error);
      // Fallback to regular refresh if cache invalidation fails
      dispatch(calculateBalance());
    }
  }, [dispatch]);

  // Function to update balance incrementally (for new transactions)
  const updateBalance = useCallback(
    (transaction: any) => {
      dispatch(updateBalanceIncrementally(transaction));
    },
    [dispatch],
  );

  // Function to mark balance as stale (when data might be outdated)
  const markStale = useCallback(() => {
    dispatch(setStale());
  }, [dispatch]);

  // Function to invalidate cache only
  const invalidateCache = useCallback(async () => {
    try {
      await dispatch(invalidateBalanceCache());
    } catch (error) {
      console.error('Error invalidating cache:', error);
      // Fallback to marking as stale
      dispatch(forceInvalidateCache());
    }
  }, [dispatch]);

  return {
    ...balance,
    refreshBalance,
    forceRefreshBalance,
    updateBalance,
    markStale,
    invalidateCache,
  };
};

// Hook for components that need to know if balance is loading
export const useBalanceLoading = () => {
  return useSelector((state: RootState) => state.balance.isLoading);
};

// Hook for components that need to know if balance is stale
export const useBalanceStale = () => {
  return useSelector((state: RootState) => state.balance.isStale);
};
