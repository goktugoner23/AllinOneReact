import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { getDb } from "@shared/services/firebase/firebase";
import { firebaseIdManager } from "@shared/services/firebase/firebaseIdManager";
import { Transaction } from "@features/transactions/types/Transaction";
import { logger } from "@shared/utils/logger";

export async function addTransaction(
  transaction: Omit<Transaction, "id">,
): Promise<void> {
  try {
    const db = getDb();
    const transactionId = await firebaseIdManager.getNextId("transactions");

    const transactionData = {
      id: transactionId,
      amount: transaction.amount,
      type: transaction.type, // Category name (same as category)
      description: transaction.description || "", // Ensure not null like Kotlin
      isIncome: transaction.isIncome,
      date: transaction.date,
      category: transaction.category,
      ...(transaction.relatedRegistrationId !== undefined && {
        relatedRegistrationId: transaction.relatedRegistrationId,
      }),
    };

    await setDoc(
      doc(db, "transactions", transactionId.toString()),
      transactionData,
    );
    
    // Clear transaction cache
    transactionCache = null;
  } catch (error) {
    logger.error("Error adding transaction", error, "addTransaction");
    throw error;
  }
}

export async function updateTransaction(
  transaction: Transaction,
): Promise<void> {
  try {
    const db = getDb();

    const transactionData = {
      id: transaction.id,
      amount: transaction.amount,
      type: transaction.type, // Category name (same as category)
      description: transaction.description || "", // Ensure not null like Kotlin
      isIncome: transaction.isIncome,
      date: transaction.date,
      category: transaction.category,
      ...(transaction.relatedRegistrationId !== undefined && {
        relatedRegistrationId: transaction.relatedRegistrationId,
      }),
    };

    await setDoc(doc(db, "transactions", transaction.id), transactionData);
    
    // Clear transaction cache
    transactionCache = null;
  } catch (error) {
    logger.error("Error updating transaction", error, "updateTransaction");
    throw error;
  }
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  try {
    const db = getDb();
    await deleteDoc(doc(db, "transactions", transactionId));
    
    // Clear transaction cache
    transactionCache = null;
  } catch (error) {
    logger.error("Error deleting transaction", error, "deleteTransaction");
    throw error;
  }
}

// Cache for transaction counts and sums
let transactionCache: { 
  count: number; 
  totalIncome: number; 
  totalExpense: number;
  timestamp: number 
} | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchTransactions(limit: number = 50): Promise<Transaction[]> {
  try {
    const db = getDb();

    logger.debug(`Fetching transactions (limit: ${limit})`, {}, "fetchTransactions");

    // Get limited transactions without device filtering
    const q = query(collection(db, "transactions"));
    const snapshot = await getDocs(q);

    logger.debug(
      "Total transactions in database",
      { count: snapshot.docs.length },
      "fetchTransactions",
    );

    // Map data exactly like Kotlin app
    const transactions = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id?.toString() ?? doc.id,
        amount: data.amount ?? 0,
        type: data.type ?? "", // Category name
        description: data.description ?? "", // Ensure not null like Kotlin
        isIncome: data.isIncome ?? false,
        date:
          data.date instanceof Timestamp
            ? data.date.toDate().toISOString()
            : data.date?.toDate?.()
              ? data.date.toDate().toISOString()
              : new Date().toISOString(),
        category: data.category ?? "",
        relatedRegistrationId: data.relatedRegistrationId,
      };
    });

    logger.debug(
      "Mapped transactions",
      { count: transactions.length },
      "fetchTransactions",
    );

    // Sort by date descending in memory (like Kotlin app)
    const sortedTransactions = transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    logger.debug(
      "Final sorted transactions",
      { count: sortedTransactions.length },
      "fetchTransactions",
    );
    
    // Return limited results for display purposes
    return sortedTransactions.slice(0, limit);
  } catch (error) {
    logger.error("Error fetching transactions", error, "fetchTransactions");
    return [];
  }
}

export async function getTransactionTotals(): Promise<{ totalIncome: number; totalExpense: number }> {
  try {
    const now = Date.now();
    
    // Check if we have a valid cache
    if (transactionCache && (now - transactionCache.timestamp) < CACHE_DURATION) {
      return {
        totalIncome: transactionCache.totalIncome,
        totalExpense: transactionCache.totalExpense
      };
    }
    
    const db = getDb();
    const q = query(collection(db, "transactions"));
    const snapshot = await getDocs(q);
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    // Calculate totals from all transactions
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const amount = data.amount ?? 0;
      const isIncome = data.isIncome ?? false;
      
      if (isIncome) {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }
    });
    
    // Update cache
    transactionCache = {
      count: snapshot.docs.length,
      totalIncome,
      totalExpense,
      timestamp: now
    };
    
    return { totalIncome, totalExpense };
  } catch (error) {
    logger.error("Error getting transaction totals", error, "getTransactionTotals");
    return { totalIncome: 0, totalExpense: 0 };
  }
}

export async function getTransactionCount(): Promise<number> {
  try {
    const now = Date.now();
    
    // Check if we have a valid cache
    if (transactionCache && (now - transactionCache.timestamp) < CACHE_DURATION) {
      return transactionCache.count;
    }
    
    const db = getDb();
    const q = query(collection(db, "transactions"));
    const snapshot = await getDocs(q);
    
    const count = snapshot.docs.length;
    
    // Update cache if it exists but doesn't have count
    if (transactionCache) {
      transactionCache.count = count;
      transactionCache.timestamp = now;
    } else {
      // Create new cache entry
      transactionCache = {
        count,
        totalIncome: 0,
        totalExpense: 0,
        timestamp: now
      };
    }
    
    return count;
  } catch (error) {
    logger.error("Error getting transaction count", error, "getTransactionCount");
    return 0;
  }
}
