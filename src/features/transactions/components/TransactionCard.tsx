import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '../types/Transaction';
import { useColors, spacing, textStyles, radius, shadow } from '@shared/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface TransactionCardProps {
  transaction: Transaction;
  onLongPress: (transaction: Transaction) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = React.memo(({ transaction, onLongPress }) => {
  const colors = useColors();

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

  const amountColor = transaction.isIncome ? colors.income : colors.expense;
  const iconName = transaction.isIncome ? 'arrow-down-circle' : 'arrow-up-circle';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }, shadow.sm]}
      onLongPress={() => onLongPress(transaction)}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={[styles.iconContainer, { backgroundColor: transaction.isIncome ? colors.incomeMuted : colors.expenseMuted }]}>
          <Ionicons name={iconName} size={20} color={amountColor} />
        </View>

        <View style={styles.contentColumn}>
          <Text style={[styles.typeText, { color: colors.foreground }]} numberOfLines={1}>
            {transaction.category || transaction.type}
          </Text>
          {transaction.description && (
            <Text style={[styles.descriptionText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {transaction.description}
            </Text>
          )}
          <Text style={[styles.dateText, { color: colors.foregroundSubtle }]}>{formatDate(transaction.date)}</Text>
        </View>

        <View style={styles.rightColumn}>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {transaction.isIncome ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentColumn: {
    flex: 1,
    gap: spacing[0.5],
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  typeText: {
    ...textStyles.label,
  },
  descriptionText: {
    ...textStyles.caption,
  },
  dateText: {
    ...textStyles.caption,
  },
  amountText: {
    ...textStyles.amountSmall,
  },
});
