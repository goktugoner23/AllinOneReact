import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '../types/Transaction';

interface TransactionCardProps {
  transaction: Transaction;
  onLongPress: (transaction: Transaction) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onLongPress,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onLongPress={() => onLongPress(transaction)}
      delayLongPress={500}
    >
      <View style={styles.row}>
        <View style={styles.leftColumn}>
          <Text style={styles.typeText}>{transaction.type}</Text>
          {transaction.description && (
            <Text style={styles.descriptionText}>{transaction.description}</Text>
          )}
          <Text style={styles.dateText}>{formatDate(transaction.date)}</Text>
        </View>
        
        <View style={styles.rightColumn}>
          <Text
            style={[
              styles.amountText,
              { color: transaction.isIncome ? '#4CAF50' : '#F44336' },
            ]}
          >
            {transaction.isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </Text>
          <Text style={styles.trendIcon}>
            {transaction.isIncome ? '↗' : '↘'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trendIcon: {
    fontSize: 16,
    color: '#666',
  },
});
