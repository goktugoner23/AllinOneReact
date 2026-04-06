import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';

import { FlashList } from '@shopify/flash-list';
import { Transaction } from '@features/transactions/types/Transaction';
import { BalanceCard } from '@features/transactions/components/BalanceCard';
import { TransactionForm } from '@features/transactions/components/TransactionForm';
import { SpendingPieChart } from '@features/transactions/components/SpendingPieChart';
import {
  fetchTransactions,
} from '@features/transactions/services/transactions';
import { fetchInvestments } from '@features/transactions/services/investments';
import { Investment } from '@features/transactions/types/Investment';
import { useColors, spacing } from '@shared/theme';
import { useCurrency } from '@shared/hooks/useCurrency';

interface BalanceData {
  income: number;
  expense: number;
  balance: number;
}

type ListItem =
  | {
      type: 'balance';
      data: { showLoading?: boolean; balance: BalanceData };
    }
  | { type: 'chart'; data: { transactions: Transaction[] } }
  | { type: 'form'; data: { investments: Investment[] } };

export const TransactionHomeScreen: React.FC = () => {
  const colors = useColors();
  const { convertFrom } = useCurrency();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const [txns, invs] = await Promise.all([
      fetchTransactions(1000),
      fetchInvestments(100),
    ]);
    setTransactions(txns);
    setInvestments(invs);
  }, []);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  // Sort transactions by date descending
  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions],
  );

  // Calculate current month balance, converting all currencies to selected
  const balanceData = useMemo<BalanceData>(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      const d = new Date(t.date);
      if (Number.isNaN(d.getTime())) continue;
      if (d < monthStart || d > monthEnd) continue;
      const converted = convertFrom(t.amount, t.currency);
      if (t.isIncome) income += converted;
      else expense += converted;
    }

    return { income, expense, balance: income - expense };
  }, [transactions, convertFrom]);

  const handleTransactionAdded = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  const listData: ListItem[] = [
    { type: 'balance', data: { showLoading: loading, balance: balanceData } },
    { type: 'chart', data: { transactions: sortedTransactions } },
    { type: 'form', data: { investments } },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlashList
        data={listData}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        renderItem={({ item }) => {
          switch (item.type) {
            case 'balance':
              return (
                <BalanceCard
                  showLoading={item.data.showLoading}
                  income={item.data.balance.income}
                  expense={item.data.balance.expense}
                  balance={item.data.balance.balance}
                />
              );
            case 'chart':
              return <SpendingPieChart transactions={item.data.transactions} />;
            case 'form':
              return (
                <TransactionForm
                  investments={item.data.investments}
                  onTransactionAdded={handleTransactionAdded}
                />
              );
            default:
              return null;
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        estimatedItemSize={231}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
  },
});
