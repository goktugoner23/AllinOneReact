import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Transaction } from '../types/Transaction';

interface TransactionCardProps {
  transaction: Transaction;
  onLongPress: (transaction: Transaction) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onLongPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onLongPress={() => onLongPress(transaction)}
      delayLongPress={500}
    >
      <View style={styles.row}>
        <Text
          style={[
            styles.amount,
            { color: transaction.type === 'income' ? '#2ecc71' : '#e74c3c' },
          ]}
        >
          ${transaction.amount.toFixed(2)}
        </Text>
        <Text style={styles.category}>{transaction.category}</Text>
        <Text style={styles.date}>
          {new Date(transaction.date).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.description}>{transaction.description}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  category: {
    fontSize: 14,
    color: '#888',
  },
  date: {
    fontSize: 12,
    color: '#bbb',
  },
  description: {
    marginTop: 4,
    fontSize: 13,
    color: '#444',
  },
});
