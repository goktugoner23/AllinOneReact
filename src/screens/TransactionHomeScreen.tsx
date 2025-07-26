import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Button,
} from 'react-native';
import { fetchTransactions } from '../data/transactions';
import { Transaction } from '../types/Transaction';
import { BalanceCard } from '../components/BalanceCard';
import { TransactionCard } from '../components/TransactionCard';

const PAGE_SIZE = 5;

export const TransactionHomeScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const loadTransactions = useCallback(async () => {
    setRefreshing(true);
    const txs = await fetchTransactions();
    setTransactions(
      txs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    );
    setRefreshing(false);
    setCurrentPage(0);
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const pagedTransactions = transactions.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  // Balance calculation
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleDelete = (transaction: Transaction) => {
    // TODO: Implement delete logic (Firestore)
    // For now, just filter out locally
    setTransactions(prev => prev.filter(t => t.id !== transaction.id));
  };

  return (
    <View style={styles.container}>
      <BalanceCard
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        balance={balance}
      />
      <FlatList
        data={pagedTransactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TransactionCard transaction={item} onLongPress={handleDelete} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadTransactions}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No transactions found.</Text>
        }
      />
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <Button
            title="Previous"
            onPress={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          />
          <Text style={styles.pageText}>
            {currentPage + 1} / {totalPages}
          </Text>
          <Button
            title="Next"
            onPress={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
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
  },
});
