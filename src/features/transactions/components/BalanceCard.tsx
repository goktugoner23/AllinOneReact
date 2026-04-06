import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card, CardHeader, CardContent } from '@shared/components/ui';
import { useColors, spacing, textStyles, radius } from '@shared/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCurrency } from '@shared/hooks/useCurrency';

interface BalanceCardProps {
  showLoading?: boolean;
  income: number;
  expense: number;
  balance: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = React.memo(
  ({ showLoading = false, income, expense, balance }) => {
    const colors = useColors();
    const { selectedCurrency, setSelectedCurrency } = useCurrency();

    const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const toggleCurrency = () => {
      setSelectedCurrency(selectedCurrency === 'TRY' ? 'AED' : 'TRY');
    };

    return (
      <Card variant="elevated" style={styles.card}>
        <CardHeader style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>{currentMonthName}</Text>
          <TouchableOpacity
            onPress={toggleCurrency}
            style={[styles.currencyToggle, { backgroundColor: colors.primaryMuted }]}
          >
            <Text style={[styles.badgeText, { color: colors.primary }]}>{selectedCurrency}</Text>
            <Ionicons name="swap-horizontal" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </CardHeader>

        <CardContent>
          {showLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading balance...</Text>
            </View>
          ) : (
            <View style={styles.content}>
              {/* Balance Items Row */}
              <View style={styles.balanceRow}>
                <BalanceItem label="Income" amount={income} icon="arrow-down-circle" variant="income" />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <BalanceItem label="Expense" amount={expense} icon="arrow-up-circle" variant="expense" />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <BalanceItem
                  label="Balance"
                  amount={balance}
                  icon="wallet"
                  variant={balance >= 0 ? 'income' : 'expense'}
                  isBalance
                />
              </View>
            </View>
          )}
        </CardContent>
      </Card>
    );
  },
);

interface BalanceItemProps {
  label: string;
  amount: number;
  icon: string;
  variant: 'income' | 'expense';
  isBalance?: boolean;
}

const BalanceItem: React.FC<BalanceItemProps> = ({ label, amount, icon, variant, isBalance }) => {
  const colors = useColors();
  const { format } = useCurrency();

  const getColors = () => {
    if (variant === 'income') {
      return {
        iconBg: colors.incomeMuted,
        iconColor: colors.income,
        amountColor: colors.income,
      };
    }
    return {
      iconBg: colors.expenseMuted,
      iconColor: colors.expense,
      amountColor: colors.expense,
    };
  };

  const itemColors = getColors();

  return (
    <View style={styles.balanceItem}>
      <View style={[styles.iconContainer, { backgroundColor: itemColors.iconBg }]}>
        <Ionicons name={icon} size={18} color={itemColors.iconColor} />
      </View>
      <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text
        style={[styles.balanceAmount, { color: isBalance ? itemColors.amountColor : colors.foreground }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {isBalance && amount < 0 ? '-' : ''}
        {format(Math.abs(amount))}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...textStyles.h4,
    flex: 1,
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
  },
  badgeText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  loadingText: {
    marginTop: spacing[2],
    ...textStyles.bodySmall,
  },
  content: {
    gap: spacing[4],
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  divider: {
    width: 1,
    height: 48,
    alignSelf: 'center',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  balanceLabel: {
    ...textStyles.caption,
  },
  balanceAmount: {
    ...textStyles.label,
    fontWeight: '700',
  },
});
