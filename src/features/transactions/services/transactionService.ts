import store from '@shared/store/rootStore';
import { updateBalanceIncrementally, setStale } from '@features/transactions/store/balanceSlice';
import {
  addTransaction as addTransactionRemote,
  deleteTransaction as deleteTransactionRemote,
  updateTransaction as updateTransactionRemote,
} from '@features/transactions/services/transactions';
import { Transaction } from '@features/transactions/types/Transaction';
import { logger } from '@shared/utils/logger';

/**
 * Service wrapper for transaction operations that automatically updates balance cache
 */
export class TransactionService {
  /**
   * Add a new transaction and update balance cache
   */
  static async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<void> {
    try {
      // Add transaction via REST
      await addTransactionRemote(transaction);

      // Update balance cache incrementally
      const newTransaction: Transaction = {
        ...transaction,
        id: 'temp', // Replaced by server-assigned ID
      };

      // Mark balance as stale and update incrementally
      store.dispatch(setStale());
      store.dispatch(updateBalanceIncrementally(newTransaction));

      logger.debug(
        'Transaction added and balance updated',
        {
          amount: transaction.amount,
          isIncome: transaction.isIncome,
        },
        'TransactionService',
      );
    } catch (error) {
      logger.error('Error in addTransaction service', error, 'TransactionService');
      throw error;
    }
  }

  /**
   * Update an existing transaction and update balance cache
   */
  static async updateTransaction(transaction: Transaction): Promise<void> {
    try {
      // Get the old transaction to calculate the difference
      const oldTransaction = await this.getTransactionById(transaction.id);

      // Update transaction via REST
      await updateTransactionRemote(transaction);

      if (oldTransaction) {
        // Calculate the difference and update balance
        const amountDifference = transaction.amount - oldTransaction.amount;
        const isIncomeDifference = transaction.isIncome ? amountDifference : -amountDifference;

        // Create a temporary transaction for balance update
        const balanceUpdateTransaction: Transaction = {
          id: 'temp',
          amount: Math.abs(isIncomeDifference),
          isIncome: isIncomeDifference > 0,
          type: transaction.type,
          description: transaction.description,
          date: transaction.date,
          category: transaction.category,
          currency: transaction.currency || 'TRY',
        };

        // Mark balance as stale and update incrementally
        store.dispatch(setStale());
        store.dispatch(updateBalanceIncrementally(balanceUpdateTransaction));
      }

      logger.debug(
        'Transaction updated and balance updated',
        {
          id: transaction.id,
          amount: transaction.amount,
        },
        'TransactionService',
      );
    } catch (error) {
      logger.error('Error in updateTransaction service', error, 'TransactionService');
      throw error;
    }
  }

  /**
   * Delete a transaction and update balance cache
   */
  static async deleteTransaction(transactionId: string): Promise<void> {
    try {
      // Get the transaction before deleting
      const transaction = await this.getTransactionById(transactionId);

      if (transaction) {
        // Delete transaction via REST
        await deleteTransactionRemote(transactionId);

        // Create a reverse transaction for balance update
        const reverseTransaction: Transaction = {
          ...transaction,
          amount: transaction.amount,
          isIncome: !transaction.isIncome, // Reverse the income/expense
        };

        // Mark balance as stale and update incrementally
        store.dispatch(setStale());
        store.dispatch(updateBalanceIncrementally(reverseTransaction));

        logger.debug(
          'Transaction deleted and balance updated',
          {
            id: transactionId,
            amount: transaction.amount,
          },
          'TransactionService',
        );
      } else {
        // If transaction not found, delete anyway
        await deleteTransactionRemote(transactionId);
      }
    } catch (error) {
      logger.error('Error in deleteTransaction service', error, 'TransactionService');
      throw error;
    }
  }

  /**
   * Get a transaction by ID (helper method)
   */
  private static async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const { fetchTransactions } = await import('./transactions');
      // Fetch with a reasonable limit and filter in memory for better performance
      const transactions = await fetchTransactions(1000);
      return transactions.find((t) => t.id === id) || null;
    } catch (error) {
      logger.error('Error getting transaction by ID', error, 'TransactionService');
      return null;
    }
  }
}
