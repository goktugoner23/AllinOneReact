import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTransactions } from '../data/transactions';
import { fetchInvestments } from '../data/investments';
import { Transaction, Investment } from '../types';
import PerformanceMonitor from '../utils/performanceMonitor';

interface BalanceState {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  isLoading: boolean;
  lastUpdated: string | null;
  isStale: boolean;
  error: string | null;
}

const initialState: BalanceState = {
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  isLoading: false,
  lastUpdated: null,
  isStale: false,
  error: null,
};

// Cache keys
const BALANCE_CACHE_KEY = 'balance_cache';
const BALANCE_LAST_UPDATED_KEY = 'balance_last_updated';

// Load cached balance from AsyncStorage
export const loadCachedBalance = createAsyncThunk(
  'balance/loadCached',
  async () => {
    const performanceMonitor = PerformanceMonitor.getInstance();
    performanceMonitor.startTimer('loadCachedBalance');
    
    try {
      const [cachedBalance, lastUpdated] = await Promise.all([
        AsyncStorage.getItem(BALANCE_CACHE_KEY),
        AsyncStorage.getItem(BALANCE_LAST_UPDATED_KEY),
      ]);

      if (cachedBalance && lastUpdated) {
        const balance = JSON.parse(cachedBalance);
        const lastUpdateTime = new Date(lastUpdated);
        const now = new Date();
        const hoursSinceUpdate = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);

        // Consider cache stale after 1 hour
        const isStale = hoursSinceUpdate > 1;

        performanceMonitor.endTimer('loadCachedBalance', true);
        
        return {
          ...balance,
          lastUpdated,
          isStale,
        };
      }
      
      performanceMonitor.endTimer('loadCachedBalance', true);
      return null;
    } catch (error) {
      performanceMonitor.endTimer('loadCachedBalance', false, error.message);
      console.error('Error loading cached balance:', error);
      return null;
    }
  }
);

// Calculate balance from transactions and investments
export const calculateBalance = createAsyncThunk(
  'balance/calculate',
  async (_, { getState }) => {
    const performanceMonitor = PerformanceMonitor.getInstance();
    performanceMonitor.startTimer('calculateBalance');
    
    try {
      // Check if we have cached data that's not stale
      const state = getState() as { balance: BalanceState };
      const currentBalance = state.balance;
      
      // If we have recent cached data and it's not stale, use it
      if (currentBalance.lastUpdated && !currentBalance.isStale) {
        const lastUpdated = new Date(currentBalance.lastUpdated);
        const now = new Date();
        const timeDiff = now.getTime() - lastUpdated.getTime();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (timeDiff < fiveMinutes) {
          performanceMonitor.endTimer('calculateBalance', true);
          return {
            totalIncome: currentBalance.totalIncome,
            totalExpense: currentBalance.totalExpense,
            balance: currentBalance.balance,
            lastUpdated: currentBalance.lastUpdated,
            isStale: false,
          };
        }
      }

      // Fetch both transactions and investments in parallel
      const [transactions, investments] = await Promise.all([
        fetchTransactions(),
        fetchInvestments(),
      ]);

      // Calculate totals using more efficient methods
      let totalIncome = 0;
      let totalExpense = 0;
      
      // Single pass through transactions
      for (const transaction of transactions) {
        if (transaction.isIncome) {
          totalIncome += transaction.amount;
        } else {
          totalExpense += transaction.amount;
        }
      }

      // Add investment profits/losses
      const investmentProfit = investments.reduce(
        (sum: number, inv: Investment) => sum + (inv.profitLoss || 0),
        0
      );

      const balance = totalIncome - totalExpense + investmentProfit;

      const balanceData = {
        totalIncome,
        totalExpense,
        balance,
        lastUpdated: new Date().toISOString(),
        isStale: false,
      };

      // Cache the result
      await Promise.all([
        AsyncStorage.setItem(BALANCE_CACHE_KEY, JSON.stringify(balanceData)),
        AsyncStorage.setItem(BALANCE_LAST_UPDATED_KEY, balanceData.lastUpdated),
      ]);

      performanceMonitor.endTimer('calculateBalance', true);
      return balanceData;
    } catch (error) {
      performanceMonitor.endTimer('calculateBalance', false, error.message);
      console.error('Error calculating balance:', error);
      throw error;
    }
  }
);

// Update balance incrementally (for new transactions)
export const updateBalanceIncrementally = createAsyncThunk(
  'balance/updateIncremental',
  async (transaction: Transaction, { getState }) => {
    const state = getState() as { balance: BalanceState };
    const currentBalance = state.balance;

    let newTotalIncome = currentBalance.totalIncome;
    let newTotalExpense = currentBalance.totalExpense;

    if (transaction.isIncome) {
      newTotalIncome += transaction.amount;
    } else {
      newTotalExpense += transaction.amount;
    }

    const newBalance = newTotalIncome - newTotalExpense;

    const balanceData = {
      totalIncome: newTotalIncome,
      totalExpense: newTotalExpense,
      balance: newBalance,
      lastUpdated: new Date().toISOString(),
      isStale: false,
    };

    // Update cache
    await Promise.all([
      AsyncStorage.setItem(BALANCE_CACHE_KEY, JSON.stringify(balanceData)),
      AsyncStorage.setItem(BALANCE_LAST_UPDATED_KEY, balanceData.lastUpdated),
    ]);

    return balanceData;
  }
);

// Invalidate cache and force fresh calculation
export const invalidateBalanceCache = createAsyncThunk(
  'balance/invalidateCache',
  async () => {
    const performanceMonitor = PerformanceMonitor.getInstance();
    performanceMonitor.startTimer('invalidateBalanceCache');
    
    try {
      // Clear cached data
      await Promise.all([
        AsyncStorage.removeItem(BALANCE_CACHE_KEY),
        AsyncStorage.removeItem(BALANCE_LAST_UPDATED_KEY),
      ]);
      
      performanceMonitor.endTimer('invalidateBalanceCache', true);
      return true;
    } catch (error) {
      performanceMonitor.endTimer('invalidateBalanceCache', false, error.message);
      console.error('Error invalidating balance cache:', error);
      throw error;
    }
  }
);

const balanceSlice = createSlice({
  name: 'balance',
  initialState,
  reducers: {
    setStale: (state) => {
      state.isStale = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetBalance: (state) => {
      state.totalIncome = 0;
      state.totalExpense = 0;
      state.balance = 0;
      state.lastUpdated = null;
      state.isStale = false;
      state.error = null;
    },
    // Force cache invalidation
    forceInvalidateCache: (state) => {
      state.isStale = true;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load cached balance
      .addCase(loadCachedBalance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadCachedBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.totalIncome = action.payload.totalIncome;
          state.totalExpense = action.payload.totalExpense;
          state.balance = action.payload.balance;
          state.lastUpdated = action.payload.lastUpdated;
          state.isStale = action.payload.isStale;
        }
      })
      .addCase(loadCachedBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load cached balance';
      })
      // Calculate balance
      .addCase(calculateBalance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(calculateBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.totalIncome = action.payload.totalIncome;
        state.totalExpense = action.payload.totalExpense;
        state.balance = action.payload.balance;
        state.lastUpdated = action.payload.lastUpdated;
        state.isStale = false;
      })
      .addCase(calculateBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to calculate balance';
      })
      // Update incrementally
      .addCase(updateBalanceIncrementally.fulfilled, (state, action) => {
        state.totalIncome = action.payload.totalIncome;
        state.totalExpense = action.payload.totalExpense;
        state.balance = action.payload.balance;
        state.lastUpdated = action.payload.lastUpdated;
        state.isStale = false;
      })
      // Invalidate cache
      .addCase(invalidateBalanceCache.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(invalidateBalanceCache.fulfilled, (state) => {
        state.isLoading = false;
        state.isStale = true;
        state.lastUpdated = null;
      })
      .addCase(invalidateBalanceCache.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to invalidate cache';
      });
  },
});

export const { setStale, clearError, resetBalance, forceInvalidateCache } = balanceSlice.actions;
export default balanceSlice.reducer; 