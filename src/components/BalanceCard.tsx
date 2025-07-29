import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BalanceCardProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  totalIncome,
  totalExpense,
  balance,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Balance Overview</Text>
      
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
    </View>
  );
};

interface BalanceItemProps {
  label: string;
  amount: number;
  color: string;
}

const BalanceItem: React.FC<BalanceItemProps> = ({ label, amount, color }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
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
