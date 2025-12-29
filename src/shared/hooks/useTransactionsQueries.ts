import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/lib';
import {
  fetchTransactions,
  addTransaction as addTransactionService,
  updateTransaction as updateTransactionService,
  deleteTransaction as deleteTransactionService,
} from '@features/transactions/services/transactions';
import {
  fetchInvestments,
  addInvestment as addInvestmentService,
  updateInvestment as updateInvestmentService,
  deleteInvestment as deleteInvestmentService,
} from '@features/transactions/services/investments';
import { Transaction } from '@features/transactions/types/Transaction';
import { Investment } from '@features/transactions/types/Investment';

// Hook for fetching transactions
export function useTransactions() {
  return useQuery({
    queryKey: queryKeys.transactions.list(),
    queryFn: () => fetchTransactions(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook for fetching balance
export function useBalance() {
  const { data: transactions = [] } = useTransactions();

  const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const balance = income - expense;

  return { income, expense, balance, transactions };
}

// Mutation for adding a transaction
export function useAddTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) =>
      addTransactionService(transactionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.balance() });
    },
  });
}

// Mutation for updating a transaction
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transaction: Transaction) => updateTransactionService(transaction),
    onMutate: async (updatedTransaction) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.list() });

      const previousTransactions = queryClient.getQueryData<Transaction[]>(queryKeys.transactions.list());

      queryClient.setQueryData<Transaction[]>(
        queryKeys.transactions.list(),
        (old) => old?.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t)) ?? [],
      );

      return { previousTransactions };
    },
    onError: (_err, _updatedTransaction, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(queryKeys.transactions.list(), context.previousTransactions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.balance() });
    },
  });
}

// Mutation for deleting a transaction
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) => deleteTransactionService(transactionId),
    onMutate: async (transactionId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.list() });

      const previousTransactions = queryClient.getQueryData<Transaction[]>(queryKeys.transactions.list());

      queryClient.setQueryData<Transaction[]>(
        queryKeys.transactions.list(),
        (old) => old?.filter((t) => t.id !== transactionId) ?? [],
      );

      return { previousTransactions };
    },
    onError: (_err, _transactionId, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(queryKeys.transactions.list(), context.previousTransactions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.balance() });
    },
  });
}

// Hook for fetching investments
export function useInvestments() {
  return useQuery<Investment[]>({
    queryKey: queryKeys.investments.list(),
    queryFn: () => fetchInvestments(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Mutation for adding an investment
export function useAddInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (investmentData: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) =>
      addInvestmentService(investmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.list() });
    },
  });
}

// Mutation for updating an investment
export function useUpdateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (investment: Investment) => updateInvestmentService(investment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.list() });
    },
  });
}

// Mutation for deleting an investment
export function useDeleteInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (investmentId: string) => deleteInvestmentService(investmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.list() });
    },
  });
}
