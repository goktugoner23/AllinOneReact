import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from './index';
import {
  loadCachedBalance,
  calculateBalance,
  updateBalanceIncrementally,
  setStale,
} from './balanceSlice';

export const useBalance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const balance = useSelector((state: RootState) => state.balance);

  // Initialize balance on mount with eager loading
  useEffect(() => {
    const initializeBalance = async () => {
      // First, try to load from cache (fast)
      const cachedResult = await dispatch(loadCachedBalance());
      
      // If no cache or cache is stale, calculate fresh balance
      if (!cachedResult.payload || cachedResult.payload.isStale) {
        dispatch(calculateBalance());
      }
    };

    initializeBalance();
  }, [dispatch]);

  // Function to refresh balance (force recalculation)
  const refreshBalance = useCallback(() => {
    dispatch(calculateBalance());
  }, [dispatch]);

  // Function to update balance incrementally (for new transactions)
  const updateBalance = useCallback((transaction: any) => {
    dispatch(updateBalanceIncrementally(transaction));
  }, [dispatch]);

  // Function to mark balance as stale (when data might be outdated)
  const markStale = useCallback(() => {
    dispatch(setStale());
  }, [dispatch]);

  return {
    ...balance,
    refreshBalance,
    updateBalance,
    markStale,
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