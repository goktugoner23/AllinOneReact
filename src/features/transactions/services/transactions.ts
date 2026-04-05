/**
 * Transactions service — talks to huginn-external REST.
 *
 * Replaces the former Firestore implementation. Screens import these functions
 * by name; signatures are preserved. Backend uses numeric ids; mobile uses
 * string ids, so we coerce at the boundary.
 */

import { api } from '@shared/services/api/httpClient';
import { Transaction } from '@features/transactions/types/Transaction';
import { logger } from '@shared/utils/logger';

// ──────────────────────────────────────────────────────────────────────────
// Backend DTOs (mirror of huginn-external types.ts)
// ──────────────────────────────────────────────────────────────────────────

interface BackendTransactionAttachment {
  id: number;
  transactionId: number | null;
  bucket: string;
  objectKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

interface BackendTransactionEntry {
  id: number;
  date: string;
  amount: number;
  currency: string;
  isIncome: boolean;
  description: string;
  type: string;
  category: string;
  relatedRegistrationId: number | null;
  relatedInvestmentId: number | null;
  attachments: BackendTransactionAttachment[];
}

// ──────────────────────────────────────────────────────────────────────────
// Caching (preserved from the Firestore version so totals helpers stay fast)
// ──────────────────────────────────────────────────────────────────────────

let transactionCache: {
  count: number;
  totalIncome: number;
  totalExpense: number;
  list: Transaction[];
  timestamp: number;
} | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function invalidateCache() {
  transactionCache = null;
}

// ──────────────────────────────────────────────────────────────────────────
// Mapping
// ──────────────────────────────────────────────────────────────────────────

function mapBackendToMobile(entry: BackendTransactionEntry): Transaction {
  return {
    id: String(entry.id),
    amount: entry.amount,
    type: entry.type ?? '',
    description: entry.description ?? '',
    isIncome: entry.isIncome,
    date: entry.date,
    category: entry.category ?? '',
    relatedRegistrationId: entry.relatedRegistrationId ?? undefined,
    relatedInvestmentId:
      entry.relatedInvestmentId !== null && entry.relatedInvestmentId !== undefined
        ? String(entry.relatedInvestmentId)
        : undefined,
  };
}

function buildTransactionBody(t: Omit<Transaction, 'id'> | Transaction) {
  const relatedInvestmentRaw = (t as Transaction).relatedInvestmentId;
  const relatedInvestmentId =
    relatedInvestmentRaw !== undefined && relatedInvestmentRaw !== null && relatedInvestmentRaw !== ''
      ? Number(relatedInvestmentRaw)
      : undefined;

  return {
    amount: t.amount,
    currency: 'TRY', // Mobile Transaction has no currency field; default to TRY.
    description: t.description ?? '',
    type: t.type,
    category: t.category,
    isIncome: t.isIncome,
    date: t.date,
    attachmentIds: [] as number[],
    ...(relatedInvestmentId !== undefined && Number.isFinite(relatedInvestmentId)
      ? { relatedInvestmentId }
      : {}),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Public API (signatures preserved)
// ──────────────────────────────────────────────────────────────────────────

export async function fetchTransactions(limitCount: number = 50): Promise<Transaction[]> {
  try {
    logger.debug(`Fetching transactions (limit: ${limitCount})`, {}, 'fetchTransactions');

    const entries = await api.get<BackendTransactionEntry[]>('/api/transactions', {
      searchParams: { limit: limitCount },
    });

    const transactions = (entries ?? []).map(mapBackendToMobile);

    // Populate cache opportunistically so totals/count helpers can reuse it.
    const totalIncome = transactions.reduce(
      (sum: number, t: Transaction) => (t.isIncome ? sum + t.amount : sum),
      0,
    );
    const totalExpense = transactions.reduce(
      (sum: number, t: Transaction) => (!t.isIncome ? sum + t.amount : sum),
      0,
    );
    transactionCache = {
      count: transactions.length,
      totalIncome,
      totalExpense,
      list: transactions,
      timestamp: Date.now(),
    };

    return transactions;
  } catch (error) {
    logger.error('Error fetching transactions', error, 'fetchTransactions');
    return [];
  }
}

export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<void> {
  try {
    await api.post<BackendTransactionEntry>('/api/transactions', buildTransactionBody(transaction));
    invalidateCache();
  } catch (error) {
    logger.error('Error adding transaction', error, 'addTransaction');
    throw error;
  }
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  try {
    const id = Number(transaction.id);
    if (!Number.isFinite(id)) {
      throw new Error(`Invalid transaction id: ${transaction.id}`);
    }
    await api.put<BackendTransactionEntry>(`/api/transactions/${id}`, buildTransactionBody(transaction));
    invalidateCache();
  } catch (error) {
    logger.error('Error updating transaction', error, 'updateTransaction');
    throw error;
  }
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  try {
    const id = Number(transactionId);
    if (!Number.isFinite(id)) {
      throw new Error(`Invalid transaction id: ${transactionId}`);
    }
    await api.delete<{ id: number }>(`/api/transactions/${id}`);
    invalidateCache();
  } catch (error) {
    logger.error('Error deleting transaction', error, 'deleteTransaction');
    throw error;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Totals/count helpers — no dedicated backend endpoint, compute client-side.
// ──────────────────────────────────────────────────────────────────────────

async function ensureCache(): Promise<void> {
  const now = Date.now();
  if (transactionCache && now - transactionCache.timestamp < CACHE_DURATION) {
    return;
  }
  // fetchTransactions repopulates the cache.
  await fetchTransactions(1000);
}

export async function getTransactionTotals(): Promise<{ totalIncome: number; totalExpense: number }> {
  try {
    await ensureCache();
    return {
      totalIncome: transactionCache?.totalIncome ?? 0,
      totalExpense: transactionCache?.totalExpense ?? 0,
    };
  } catch (error) {
    logger.error('Error getting transaction totals', error, 'getTransactionTotals');
    return { totalIncome: 0, totalExpense: 0 };
  }
}

export async function getTransactionCount(): Promise<number> {
  try {
    await ensureCache();
    return transactionCache?.count ?? 0;
  } catch (error) {
    logger.error('Error getting transaction count', error, 'getTransactionCount');
    return 0;
  }
}

export async function getCurrentMonthTransactionTotals(): Promise<{
  totalIncome: number;
  totalExpense: number;
}> {
  try {
    await ensureCache();
    const list = transactionCache?.list ?? [];

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of list) {
      const d = new Date(t.date);
      if (Number.isNaN(d.getTime())) continue;
      if (d < monthStart || d > monthEnd) continue;
      if (t.isIncome) totalIncome += t.amount;
      else totalExpense += t.amount;
    }

    return { totalIncome, totalExpense };
  } catch (error) {
    logger.error('Error getting current month transaction totals', error, 'getCurrentMonthTransactionTotals');
    return { totalIncome: 0, totalExpense: 0 };
  }
}

/**
 * Preserved for backward compatibility with screens that called the old
 * Firestore-based aggregate rebuild. With the REST backend there is no
 * separate aggregate document to rebuild — we simply re-fetch and recompute.
 */
export async function recalculateAggregateTotals(): Promise<{
  totalIncome: number;
  totalExpense: number;
  count: number;
}> {
  try {
    invalidateCache();
    await ensureCache();
    return {
      totalIncome: transactionCache?.totalIncome ?? 0,
      totalExpense: transactionCache?.totalExpense ?? 0,
      count: transactionCache?.count ?? 0,
    };
  } catch (error) {
    logger.error('Error recalculating aggregate totals', error, 'recalculateAggregateTotals');
    throw error;
  }
}
