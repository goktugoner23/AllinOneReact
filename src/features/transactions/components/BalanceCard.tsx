import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useBalance } from '../store/balanceHooks';

interface BalanceCardProps {
  totalIncome?: number;
  totalExpense?: number;
  balance?: number;
  showLoading?: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = React.memo(({
  totalIncome: propTotalIncome,
  totalExpense: propTotalExpense,
  balance: propBalance,
  showLoading = false,
}) => {
  // Use cached balance from Redux store
  const {
    currentMonthIncome,
    currentMonthExpense,
    currentMonthBalance,
    isLoading,
    isStale,
    lastUpdated,
  } = useBalance();

  // Use props if provided (for backward compatibility), otherwise use current month values
  const totalIncome = propTotalIncome ?? currentMonthIncome;
  const totalExpense = propTotalExpense ?? currentMonthExpense;
  const balance = propBalance ?? currentMonthBalance;

  // Show loading indicator if explicitly requested or if balance is loading
  const shouldShowLoading = showLoading || isLoading;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  // Get current month name
  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{currentMonthName}</Text>
        {isStale && (
          <Text style={styles.staleIndicator}>⚠️ Stale</Text>
        )}
        {lastUpdated && (
          <Text style={styles.lastUpdated}>
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </Text>
        )}
      </View>
      
      {shouldShowLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading balance...</Text>
        </View>
      ) : (
        <View style={styles.balanceRow}>
          <BalanceItem
            label="Income"
            amount={totalIncome}
            color="#4CAF50"
          />
          
          <BalanceItem
            label="Expense"
            amount={totalExpense}
            color="#F44336"
          />
          
          <BalanceItem
            label="Balance"
            amount={balance}
            color={balance >= 0 ? '#4CAF50' : '#F44336'}
          />
        </View>
      )}
    </View>
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
      <Text style={[styles.balanceAmount, { color }]}>
        {formatCurrency(amount)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  staleIndicator: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  lastUpdated: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
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
