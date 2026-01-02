import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { getDb } from '@shared/services/firebase/firebase';
import { firebaseIdManager } from '@shared/services/firebase/firebaseIdManager';
import { Transaction } from '@features/transactions/types/Transaction';
import { logger } from '@shared/utils/logger';

// Aggregate totals document path
const TOTALS_DOC_ID = 'aggregate_totals';

/**
 * Update aggregate totals document atomically
 * This maintains pre-calculated totals for instant balance retrieval
 */
async function updateAggregateTotals(amount: number, isIncome: boolean, operation: 'add' | 'remove'): Promise<void> {
  try {
    const db = getDb();
    const totalsRef = doc(db, 'transactions_meta', TOTALS_DOC_ID);

    const multiplier = operation === 'add' ? 1 : -1;
    const incomeChange = isIncome ? amount * multiplier : 0;
    const expenseChange = !isIncome ? amount * multiplier : 0;
    const countChange = multiplier;

    await runTransaction(db, async (transaction) => {
      const totalsDoc = await transaction.get(totalsRef);

      if (!totalsDoc.exists()) {
        // Initialize totals document if it doesn't exist
        transaction.set(totalsRef, {
          totalIncome: incomeChange,
          totalExpense: expenseChange,
          count: operation === 'add' ? 1 : 0,
          lastUpdated: Timestamp.now(),
        });
      } else {
        transaction.update(totalsRef, {
          totalIncome: increment(incomeChange),
          totalExpense: increment(expenseChange),
          count: increment(countChange),
          lastUpdated: Timestamp.now(),
        });
      }
    });

    // Invalidate cache since we updated
    transactionCache = null;
  } catch (error) {
    logger.error('Error updating aggregate totals', error, 'updateAggregateTotals');
    // Don't throw - totals update failure shouldn't block the transaction
  }
}

/**
 * Initialize or recalculate aggregate totals from all transactions
 * Call this once to set up the totals document, or to fix inconsistencies
 */
export async function recalculateAggregateTotals(): Promise<{
  totalIncome: number;
  totalExpense: number;
  count: number;
}> {
  try {
    const db = getDb();
    const q = query(collection(db, 'transactions'));
    const snapshot = await getDocs(q);

    let totalIncome = 0;
    let totalExpense = 0;

    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const amount = data.amount ?? 0;
      const isIncome = data.isIncome ?? false;

      if (isIncome) {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }
    });

    // Save to aggregate document
    const totalsRef = doc(db, 'transactions_meta', TOTALS_DOC_ID);
    await setDoc(totalsRef, {
      totalIncome,
      totalExpense,
      count: snapshot.docs.length,
      lastUpdated: Timestamp.now(),
    });

    logger.debug(
      'Recalculated aggregate totals',
      { totalIncome, totalExpense, count: snapshot.docs.length },
      'recalculateAggregateTotals',
    );

    return { totalIncome, totalExpense, count: snapshot.docs.length };
  } catch (error) {
    logger.error('Error recalculating aggregate totals', error, 'recalculateAggregateTotals');
    throw error;
  }
}

export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<void> {
  try {
    const db = getDb();
    const transactionId = await firebaseIdManager.getNextId('transactions');

    const transactionData = {
      id: transactionId,
      amount: transaction.amount,
      type: transaction.type, // Category name (same as category)
      description: transaction.description || '', // Ensure not null like Kotlin
      isIncome: transaction.isIncome,
      date: transaction.date,
      category: transaction.category,
      ...(transaction.relatedRegistrationId !== undefined && {
        relatedRegistrationId: transaction.relatedRegistrationId,
      }),
      ...((transaction as any).relatedInvestmentId && {
        relatedInvestmentId: (transaction as any).relatedInvestmentId,
      }),
    };

    await setDoc(doc(db, 'transactions', transactionId.toString()), transactionData);

    // Update aggregate totals
    await updateAggregateTotals(transaction.amount, transaction.isIncome, 'add');

    // Clear transaction cache
    transactionCache = null;
  } catch (error) {
    logger.error('Error adding transaction', error, 'addTransaction');
    throw error;
  }
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  try {
    const db = getDb();

    const transactionData = {
      id: transaction.id,
      amount: transaction.amount,
      type: transaction.type, // Category name (same as category)
      description: transaction.description || '', // Ensure not null like Kotlin
      isIncome: transaction.isIncome,
      date: transaction.date,
      category: transaction.category,
      ...(transaction.relatedRegistrationId !== undefined && {
        relatedRegistrationId: transaction.relatedRegistrationId,
      }),
      ...((transaction as any).relatedInvestmentId && {
        relatedInvestmentId: (transaction as any).relatedInvestmentId,
      }),
    };

    await setDoc(doc(db, 'transactions', transaction.id), transactionData);

    // Clear transaction cache
    transactionCache = null;
  } catch (error) {
    logger.error('Error updating transaction', error, 'updateTransaction');
    throw error;
  }
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  try {
    const db = getDb();

    // Get transaction data before deleting to update totals
    const transactionRef = doc(db, 'transactions', transactionId);
    const transactionDoc = await getDoc(transactionRef);

    if (transactionDoc.exists()) {
      const data = transactionDoc.data();
      const amount = data.amount ?? 0;
      const isIncome = data.isIncome ?? false;

      await deleteDoc(transactionRef);

      // Update aggregate totals
      await updateAggregateTotals(amount, isIncome, 'remove');
    } else {
      await deleteDoc(transactionRef);
    }

    // Clear transaction cache
    transactionCache = null;
  } catch (error) {
    logger.error('Error deleting transaction', error, 'deleteTransaction');
    throw error;
  }
}

// Cache for transaction counts and sums
let transactionCache: {
  count: number;
  totalIncome: number;
  totalExpense: number;
  timestamp: number;
} | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchTransactions(limitCount: number = 50): Promise<Transaction[]> {
  try {
    const db = getDb();

    logger.debug(`Fetching transactions (limit: ${limitCount})`, {}, 'fetchTransactions');

    // Use server-side ordering and limit for better performance
    // Requires index on 'date' field (DESCENDING)
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'), firestoreLimit(limitCount));
    const snapshot = await getDocs(q);

    logger.debug('Fetched transactions from server', { count: snapshot.docs.length }, 'fetchTransactions');

    // Map data exactly like Kotlin app
    const transactions = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      
      // Handle date - can be Timestamp, Date, string (ISO), or number (epoch)
      let dateString: string;
      if (data.date instanceof Timestamp) {
        dateString = data.date.toDate().toISOString();
      } else if (data.date?.toDate) {
        // Firestore Timestamp-like object
        dateString = data.date.toDate().toISOString();
      } else if (typeof data.date === 'string') {
        // Already an ISO string or date string - validate and use as-is
        const parsed = new Date(data.date);
        dateString = isNaN(parsed.getTime()) ? new Date().toISOString() : data.date;
      } else if (typeof data.date === 'number') {
        // Epoch timestamp in milliseconds
        dateString = new Date(data.date).toISOString();
      } else {
        // Fallback to current date
        dateString = new Date().toISOString();
      }
      
      return {
        id: data.id?.toString() ?? docSnapshot.id,
        amount: data.amount ?? 0,
        type: data.type ?? '', // Category name
        description: data.description ?? '', // Ensure not null like Kotlin
        isIncome: data.isIncome ?? false,
        date: dateString,
        category: data.category ?? '',
        relatedRegistrationId: data.relatedRegistrationId,
        relatedInvestmentId: data.relatedInvestmentId?.toString(),
      };
    });

    logger.debug('Final transactions', { count: transactions.length }, 'fetchTransactions');

    return transactions;
  } catch (error) {
    logger.error('Error fetching transactions', error, 'fetchTransactions');
    return [];
  }
}

export async function getTransactionTotals(): Promise<{ totalIncome: number; totalExpense: number }> {
  try {
    const now = Date.now();

    // Check if we have a valid cache
    if (transactionCache && now - transactionCache.timestamp < CACHE_DURATION) {
      return {
        totalIncome: transactionCache.totalIncome,
        totalExpense: transactionCache.totalExpense,
      };
    }

    const db = getDb();

    // Try to get from aggregate document first (instant - single doc read)
    const totalsRef = doc(db, 'transactions_meta', TOTALS_DOC_ID);
    const totalsDoc = await getDoc(totalsRef);

    if (totalsDoc.exists()) {
      const data = totalsDoc.data();
      const totalIncome = data.totalIncome ?? 0;
      const totalExpense = data.totalExpense ?? 0;

      // Update cache
      transactionCache = {
        count: data.count ?? 0,
        totalIncome,
        totalExpense,
        timestamp: now,
      };

      logger.debug('Got totals from aggregate document', { totalIncome, totalExpense }, 'getTransactionTotals');
      return { totalIncome, totalExpense };
    }

    // Fallback: Calculate from all transactions and initialize aggregate document
    logger.debug('Aggregate document not found, recalculating...', {}, 'getTransactionTotals');
    const result = await recalculateAggregateTotals();

    // Update cache
    transactionCache = {
      count: result.count,
      totalIncome: result.totalIncome,
      totalExpense: result.totalExpense,
      timestamp: now,
    };

    return { totalIncome: result.totalIncome, totalExpense: result.totalExpense };
  } catch (error) {
    logger.error('Error getting transaction totals', error, 'getTransactionTotals');
    return { totalIncome: 0, totalExpense: 0 };
  }
}

export async function getTransactionCount(): Promise<number> {
  try {
    const now = Date.now();

    // Check if we have a valid cache
    if (transactionCache && now - transactionCache.timestamp < CACHE_DURATION) {
      return transactionCache.count;
    }

    const db = getDb();

    // Try to get from aggregate document first (instant - single doc read)
    const totalsRef = doc(db, 'transactions_meta', TOTALS_DOC_ID);
    const totalsDoc = await getDoc(totalsRef);

    if (totalsDoc.exists()) {
      const data = totalsDoc.data();
      const count = data.count ?? 0;

      // Update cache
      transactionCache = {
        count,
        totalIncome: data.totalIncome ?? 0,
        totalExpense: data.totalExpense ?? 0,
        timestamp: now,
      };

      return count;
    }

    // Fallback: recalculate
    const result = await recalculateAggregateTotals();
    return result.count;
  } catch (error) {
    logger.error('Error getting transaction count', error, 'getTransactionCount');
    return 0;
  }
}

export async function getCurrentMonthTransactionTotals(): Promise<{ totalIncome: number; totalExpense: number }> {
  try {
    const db = getDb();
    const q = query(collection(db, 'transactions'));
    const snapshot = await getDocs(q);

    // Get current month start and end dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let totalIncome = 0;
    let totalExpense = 0;

    // Calculate totals from transactions in current month
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const amount = data.amount ?? 0;
      const isIncome = data.isIncome ?? false;

      // Parse transaction date
      let transactionDate: Date;
      if (data.date instanceof Timestamp) {
        transactionDate = data.date.toDate();
      } else if (data.date?.toDate) {
        transactionDate = data.date.toDate();
      } else if (typeof data.date === 'string') {
        transactionDate = new Date(data.date);
      } else {
        return; // Skip if date is invalid
      }

      // Check if transaction is in current month
      if (transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd) {
        if (isIncome) {
          totalIncome += amount;
        } else {
          totalExpense += amount;
        }
      }
    });

    return { totalIncome, totalExpense };
  } catch (error) {
    logger.error('Error getting current month transaction totals', error, 'getCurrentMonthTransactionTotals');
    return { totalIncome: 0, totalExpense: 0 };
  }
}
