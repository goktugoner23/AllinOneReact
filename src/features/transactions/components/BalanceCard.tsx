import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, CardHeader, CardContent } from '@shared/components/ui';
import { SegmentedControl } from '@shared/components/ui/SegmentedControl';
import { useBalance } from '@shared/hooks/useTransactionsQueries';
import { useCurrencyRates } from '@shared/hooks/useCurrencyRates';
import { useCurrency } from '@features/transactions/context/CurrencyContext';
import { convertAmount, formatCurrencyAmount, Currency } from '@features/transactions/services/currencyService';
import { useColors, spacing, textStyles, radius } from '@shared/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface BalanceCardProps {
  showLoading?: boolean;
}

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: 'TRY', label: 'TRY' },
  { value: 'USD', label: 'USD' },
  { value: 'AED', label: 'AED' },
];

export const BalanceCard: React.FC<BalanceCardProps> = React.memo(({ showLoading = false }) => {
  const colors = useColors();
  const { income, expense, balance } = useBalance();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const { data: ratesData } = useCurrencyRates('TRY');

  const rates = ratesData?.rates ?? {};

  const displayIncome = convertAmount(income, selectedCurrency, rates);
  const displayExpense = convertAmount(expense, selectedCurrency, rates);
  const displayBalance = convertAmount(balance, selectedCurrency, rates);

  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card variant="elevated" style={styles.card}>
      <CardHeader style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>{currentMonthName}</Text>
        <View style={[styles.badge, { backgroundColor: colors.primaryMuted }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>Monthly</Text>
        </View>
      </CardHeader>

      <CardContent>
        <SegmentedControl
          options={CURRENCY_OPTIONS}
          value={selectedCurrency}
          onChange={setSelectedCurrency}
          size="sm"
          fullWidth
          style={styles.currencySelector}
        />

        {showLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading balance...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.balanceRow}>
              <BalanceItem
                label="Income"
                amount={displayIncome}
                currency={selectedCurrency}
                icon="arrow-down-circle"
                variant="income"
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <BalanceItem
                label="Expense"
                amount={displayExpense}
                currency={selectedCurrency}
                icon="arrow-up-circle"
                variant="expense"
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <BalanceItem
                label="Balance"
                amount={displayBalance}
                currency={selectedCurrency}
                icon="wallet"
                variant={displayBalance >= 0 ? 'income' : 'expense'}
                isBalance
              />
            </View>
          </View>
        )}
      </CardContent>
    </Card>
  );
});

interface BalanceItemProps {
  label: string;
  amount: number;
  currency: Currency;
  icon: string;
  variant: 'income' | 'expense';
  isBalance?: boolean;
}

const BalanceItem: React.FC<BalanceItemProps> = ({ label, amount, currency, icon, variant, isBalance }) => {
  const colors = useColors();

  const getColors = () => {
    if (variant === 'income') {
      return { iconBg: colors.incomeMuted, iconColor: colors.income, amountColor: colors.income };
    }
    return { iconBg: colors.expenseMuted, iconColor: colors.expense, amountColor: colors.expense };
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
        {formatCurrencyAmount(Math.abs(amount), currency)}
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
  badgeText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  currencySelector: {
    marginBottom: spacing[3],
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
