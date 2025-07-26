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
}) => (
  <View style={styles.card}>
    <Text style={styles.title}>Balance Overview</Text>
    <View style={styles.row}>
      <View style={styles.column}>
        <Text style={styles.label}>Income</Text>
        <Text style={[styles.amount, { color: '#2ecc71' }]}>
          {totalIncome.toFixed(2)}
        </Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.label}>Expense</Text>
        <Text style={[styles.amount, { color: '#e74c3c' }]}>
          {totalExpense.toFixed(2)}
        </Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.label}>Balance</Text>
        <Text
          style={[
            styles.amount,
            { color: balance >= 0 ? '#2ecc71' : '#e74c3c' },
          ]}
        >
          {balance.toFixed(2)}
        </Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#888',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
