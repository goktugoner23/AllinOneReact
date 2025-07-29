import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Button,
  Alert,
} from 'react-native';
import { fetchTransactions, deleteTransaction } from '../data/transactions';
import { Transaction } from '../types/Transaction';
import { BalanceCard } from '../components/BalanceCard';
import { TransactionCard } from '../components/TransactionCard';
import { TransactionForm } from '../components/TransactionForm';
import { SpendingPieChart } from '../components/SpendingPieChart';

const PAGE_SIZE = 5;

type ListItem = 
  | { type: 'balance'; data: { totalIncome: number; totalExpense: number; balance: number } }
  | { type: 'chart'; data: { transactions: Transaction[] } }
  | { type: 'form'; data: { onTransactionAdded: () => void } }
  | { type: 'transactions-header'; data: {} }
  | { type: 'transactions'; data: { transactions: Transaction[]; onDelete: (transaction: Transaction) => void } }
  | { type: 'pagination'; data: { currentPage: number; totalPages: number; onPrevious: () => void; onNext: () => void } };

export const TransactionHomeScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Force refresh transactions when this screen is first displayed (like Kotlin app)
  useEffect(() => {
    forceRefreshTransactions();
  }, []);

  const forceRefreshTransactions = useCallback(async () => {
    console.log('Force refreshing transactions...');
    setRefreshing(true);
    try {
      const txs = await fetchTransactions();
      // Sort by date descending like Kotlin app
      const sortedTransactions = txs.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setTransactions(sortedTransactions);
      setCurrentPage(0);
      console.log('Force refresh completed');
    } catch (error) {
      console.error('Error force refreshing transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    await forceRefreshTransactions();
  }, [forceRefreshTransactions]);

  // Pagination logic - exactly like Kotlin app
  const totalPages = transactions.length === 0 ? 0 : Math.ceil(transactions.length / PAGE_SIZE);
  const startIndex = currentPage * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, transactions.length);
  const pagedTransactions = startIndex < transactions.length 
    ? transactions.slice(startIndex, endIndex)
    : [];

  // Balance calculation - updated to use isIncome field
  const totalIncome = transactions
    .filter(t => t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter(t => !t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleDelete = async (transaction: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ${transaction.isIncome ? 'income' : 'expense'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
              await forceRefreshTransactions(); // Force refresh like Kotlin app
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  const handleTransactionAdded = () => {
    // Force refresh like Kotlin app to ensure UI consistency
    forceRefreshTransactions();
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const listData: ListItem[] = [
    { type: 'balance', data: { totalIncome, totalExpense, balance } },
    { type: 'chart', data: { transactions } },
    { type: 'form', data: { onTransactionAdded: handleTransactionAdded } },
    { type: 'transactions-header', data: {} },
    { type: 'transactions', data: { transactions: pagedTransactions, onDelete: handleDelete } },
  ];

  // Add pagination if needed - exactly like Kotlin app
  if (totalPages > 1) {
    listData.push({
      type: 'pagination',
      data: {
        currentPage,
        totalPages,
        onPrevious: handlePreviousPage,
        onNext: handleNextPage,
      },
    });
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        renderItem={({ item }) => {
          switch (item.type) {
            case 'balance':
              return (
                <BalanceCard
                  totalIncome={item.data.totalIncome}
                  totalExpense={item.data.totalExpense}
                  balance={item.data.balance}
                />
              );
            case 'chart':
              return <SpendingPieChart transactions={item.data.transactions} />;
            case 'form':
              return <TransactionForm onTransactionAdded={item.data.onTransactionAdded} />;
            case 'transactions-header':
              return (
                <View style={styles.transactionsHeader}>
                  <Text style={styles.sectionTitle}>Transactions</Text>
                </View>
              );
            case 'transactions':
              return (
                <View style={styles.transactionsSection}>
                  {item.data.transactions.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.empty}>No transactions found</Text>
                    </View>
                  ) : (
                    item.data.transactions.map((transaction: Transaction) => (
                      <TransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        onLongPress={item.data.onDelete}
                      />
                    ))
                  )}
                </View>
              );
            case 'pagination':
              return (
                <View style={styles.pagination}>
                  <Button
                    title="Previous"
                    onPress={item.data.onPrevious}
                    disabled={item.data.currentPage === 0}
                  />
                  <Text style={styles.pageText}>
                    {item.data.currentPage + 1} / {item.data.totalPages}
                  </Text>
                  <Button
                    title="Next"
                    onPress={item.data.onNext}
                    disabled={item.data.currentPage === item.data.totalPages - 1}
                  />
                </View>
              );
            default:
              return null;
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={forceRefreshTransactions} // Use force refresh like Kotlin app
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  transactionsHeader: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  transactionsSection: {
    marginTop: 8,
  },
  emptyContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  pageText: {
    marginHorizontal: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
