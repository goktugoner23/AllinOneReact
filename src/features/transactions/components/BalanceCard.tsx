import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, CardHeader, CardContent } from '@shared/components/ui';
import { useBalance } from '@shared/hooks/useTransactionsQueries';

interface BalanceCardProps {
  showLoading?: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = React.memo(({ showLoading = false }) => {
  // Use TanStack Query based balance hook - balance is computed from transactions
  const { income, expense, balance } = useBalance();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  // Get current month name
  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card variant="elevated" style={styles.card}>
      <CardHeader style={styles.header}>
        <Text style={styles.title}>{currentMonthName}</Text>
      </CardHeader>

      <CardContent>
        {showLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading balance...</Text>
          </View>
        ) : (
          <View style={styles.balanceRow}>
            <BalanceItem label="Income" amount={income} color="#4CAF50" />

            <BalanceItem label="Expense" amount={expense} color="#F44336" />

            <BalanceItem label="Balance" amount={balance} color={balance >= 0 ? '#4CAF50' : '#F44336'} />
          </View>
        )}
      </CardContent>
    </Card>
  );
});

interface BalanceItemProps {
  label: string;
  amount: number;
  color: string;
}

const BalanceItem: React.FC<BalanceItemProps> = ({ label, amount, color }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  return (
    <View style={styles.balanceItem}>
      <Text style={styles.balanceLabel}>{label}</Text>
      <Text style={[styles.balanceAmount, { color }]}>{formatCurrency(amount)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
