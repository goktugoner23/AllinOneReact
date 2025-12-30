import React, { useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';

import { FlashList } from '@shopify/flash-list';
import { Transaction } from '@features/transactions/types/Transaction';
import { BalanceCard } from '@features/transactions/components/BalanceCard';
import { TransactionForm } from '@features/transactions/components/TransactionForm';
import { SpendingPieChart } from '@features/transactions/components/SpendingPieChart';
import { useTransactions } from '@shared/hooks/useTransactionsQueries';
import { useColors, spacing } from '@shared/theme';

type ListItem =
  | {
      type: 'balance';
      data: { showLoading?: boolean };
    }
  | { type: 'chart'; data: { transactions: Transaction[] } }
  | { type: 'form'; data: Record<string, never> };

export const TransactionHomeScreen: React.FC = () => {
  const colors = useColors();
  // Use TanStack Query for transactions
  const { data: transactions = [], isLoading, isFetching, refetch } = useTransactions();

  // Sort transactions by date descending
  const sortedTransactions = React.useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions],
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const listData: ListItem[] = [
    { type: 'balance', data: { showLoading: isLoading || isFetching } },
    { type: 'chart', data: { transactions: sortedTransactions } },
    { type: 'form', data: {} },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlashList
        data={listData}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        renderItem={({ item }) => {
          switch (item.type) {
            case 'balance':
              return <BalanceCard showLoading={item.data.showLoading} />;
            case 'chart':
              return <SpendingPieChart transactions={item.data.transactions} />;
            case 'form':
              return <TransactionForm />;
            default:
              return null;
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
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
