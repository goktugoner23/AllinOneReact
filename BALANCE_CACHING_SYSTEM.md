# Balance Caching System

## Overview

The balance caching system is designed to significantly improve the performance of balance calculations by implementing eager loading, caching, and incremental updates. This system addresses the performance bottleneck where balance calculations were taking too long due to fetching all transaction data from Firebase on every app launch.

## Architecture

### 1. Redux Store Integration
- **File**: `src/store/balanceSlice.ts`
- **Purpose**: Centralized state management for balance data
- **Features**:
  - Async balance calculation with caching
  - Incremental balance updates
  - Cache staleness detection
  - Performance monitoring

### 2. Custom Hooks
- **File**: `src/store/balanceHooks.ts`
- **Purpose**: React hooks for balance management
- **Features**:
  - `useBalance()`: Main hook for balance data and operations
  - `useBalanceLoading()`: Hook for loading state
  - `useBalanceStale()`: Hook for stale state detection

### 3. Background Preloader
- **File**: `src/services/BalancePreloader.ts`
- **Purpose**: Preload balance data when app starts
- **Features**:
  - Singleton pattern for app-wide balance preloading
  - Cache-first loading strategy
  - Background calculation for stale data

### 4. Transaction Service
- **File**: `src/data/transactionService.ts`
- **Purpose**: Wrapper for transaction operations with automatic balance updates
- **Features**:
  - Automatic balance cache updates on transaction changes
  - Incremental balance calculations
  - Error handling and logging

### 5. Performance Monitoring
- **File**: `src/utils/performanceMonitor.ts`
- **Purpose**: Track and monitor balance loading performance
- **Features**:
  - Operation timing
  - Performance metrics collection
  - Slow operation detection

## How It Works

### 1. App Launch Flow
```
App.tsx → BalancePreloader → loadCachedBalance() → calculateBalance() (if needed)
```

1. **App starts**: `BalancePreloader` is initialized
2. **Cache check**: Load balance from AsyncStorage (fast)
3. **Staleness check**: If cache is >1 hour old, mark as stale
4. **Background calculation**: If stale or no cache, calculate fresh balance
5. **UI update**: Balance card shows cached data immediately, updates when fresh data arrives

### 2. Balance Calculation Flow
```
calculateBalance() → fetchTransactions() + fetchInvestments() → calculate totals → cache result
```

1. **Parallel fetching**: Transactions and investments fetched simultaneously
2. **Calculation**: Income, expense, and investment profits calculated
3. **Caching**: Results stored in AsyncStorage with timestamp
4. **Performance tracking**: All operations timed and logged

### 3. Transaction Update Flow
```
TransactionService.addTransaction() → Firebase update → incremental balance update
```

1. **Transaction added**: New transaction saved to Firebase
2. **Balance update**: Balance cache updated incrementally
3. **Stale marking**: Balance marked as stale for UI indication
4. **Performance tracking**: Update operation timed

## Performance Improvements

### Before (Slow)
- ❌ Fetch all transactions on every app launch
- ❌ Calculate balance from scratch every time
- ❌ No caching mechanism
- ❌ Synchronous balance calculation
- ❌ No performance monitoring

### After (Fast)
- ✅ Cache balance data in AsyncStorage
- ✅ Eager loading on app start
- ✅ Incremental balance updates
- ✅ Background calculation for stale data
- ✅ Performance monitoring and logging
- ✅ Parallel data fetching

## Cache Strategy

### Cache Keys
- `balance_cache`: Serialized balance data
- `balance_last_updated`: Timestamp of last update

### Cache Invalidation
- **Time-based**: Cache considered stale after 1 hour
- **Event-based**: Cache marked stale on transaction changes
- **Manual**: Cache can be manually invalidated

### Cache Structure
```typescript
interface CachedBalance {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  lastUpdated: string;
  isStale: boolean;
}
```

## Usage Examples

### Basic Usage
```typescript
import { useBalance } from '../store/balanceHooks';

const MyComponent = () => {
  const { totalIncome, totalExpense, balance, isLoading, isStale } = useBalance();
  
  return (
    <BalanceCard 
      showLoading={isLoading}
    />
  );
};
```

### Manual Refresh
```typescript
const { refreshBalance } = useBalance();

const handleRefresh = () => {
  refreshBalance();
};
```

### Transaction Operations
```typescript
import { TransactionService } from '../data/transactionService';

// Add transaction (automatically updates balance)
await TransactionService.addTransaction({
  amount: 100,
  isIncome: true,
  type: 'Salary',
  // ... other fields
});

// Delete transaction (automatically updates balance)
await TransactionService.deleteTransaction('transaction-id');
```

## Performance Monitoring

### Metrics Tracked
- `loadCachedBalance`: Time to load from cache
- `calculateBalance`: Time to calculate fresh balance
- `updateBalanceIncremental`: Time for incremental updates

### Performance Thresholds
- **Warning**: Operations taking >1000ms
- **Logging**: All operations logged in development
- **Analytics**: Performance data available for analysis

### Example Logs
```
Performance: loadCachedBalance completed in 15.23ms
Performance: calculateBalance completed in 2345.67ms
Performance: Slow operation detected - calculateBalance took 2345.67ms
```

## Configuration

### Cache Duration
```typescript
// In balanceSlice.ts
const CACHE_STALE_HOURS = 1; // Cache considered stale after 1 hour
```

### Performance Monitoring
```typescript
// In performanceMonitor.ts
private isEnabled = __DEV__; // Only enable in development
```

## Migration Guide

### For Existing Components
1. **Replace direct balance calculations** with `useBalance()` hook
2. **Update BalanceCard usage** to use new props structure
3. **Replace transaction operations** with `TransactionService`
4. **Add performance monitoring** where needed

### Example Migration
```typescript
// Before
const totalIncome = transactions.filter(t => t.isIncome).reduce((sum, t) => sum + t.amount, 0);
const totalExpense = transactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0);
const balance = totalIncome - totalExpense;

// After
const { totalIncome, totalExpense, balance } = useBalance();
```

## Benefits

1. **Faster App Launch**: Balance shows immediately from cache
2. **Reduced Firebase Calls**: Fewer network requests
3. **Better UX**: No loading delays for balance display
4. **Performance Insights**: Detailed performance monitoring
5. **Scalability**: System handles large transaction datasets efficiently
6. **Offline Support**: Balance available even without network

## Future Enhancements

1. **Smart Cache Invalidation**: Based on transaction count changes
2. **Background Sync**: Periodic balance updates in background
3. **Compression**: Compress cached data for storage efficiency
4. **Analytics Integration**: Send performance data to analytics service
5. **Predictive Loading**: Preload balance based on usage patterns 