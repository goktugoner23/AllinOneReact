import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, CardHeader, CardContent } from '@shared/components/ui';
import { Transaction } from '../types/Transaction';
import { useColors, spacing, textStyles, radius, categoryColors } from '@shared/theme';

interface SpendingPieChartProps {
  transactions: Transaction[];
}

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export const SpendingPieChart: React.FC<SpendingPieChartProps> = ({ transactions }) => {
  const colors = useColors();

  // Get current month boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Only consider expenses from current month for the chart
  const expenses = transactions.filter((t) => {
    if (t.isIncome) return false;
    const txDate = new Date(t.date);
    return txDate >= startOfMonth && txDate <= endOfMonth;
  });

  // Get month name for display
  const monthName = now.toLocaleString('default', { month: 'long' });

  if (expenses.length === 0) {
    return (
      <Card variant="elevated" style={styles.card}>
        <CardHeader>
          <Text style={[styles.title, { color: colors.foreground }]}>{monthName} Spending</Text>
        </CardHeader>
        <CardContent>
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No expenses this month</Text>
          </View>
        </CardContent>
      </Card>
    );
  }

  // Group expenses by category and calculate totals
  const categoryTotals = expenses.reduce(
    (acc, transaction) => {
      const category = transaction.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + transaction.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

  // Convert to array and sort by amount
  const categoryData: CategoryData[] = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalExpenses) * 100,
    }))
    .sort((a, b) => b.amount - a.amount)
    .map((item, index) => ({
      ...item,
      color: categoryColors[index % categoryColors.length],
    }));

  // Take top 3 categories and group the rest as "Others"
  const displayData = categoryData.slice(0, 3);
  if (categoryData.length > 3) {
    const othersAmount = categoryData.slice(3).reduce((sum, item) => sum + item.amount, 0);
    const othersPercentage = (othersAmount / totalExpenses) * 100;
    displayData.push({
      category: 'Others',
      amount: othersAmount,
      percentage: othersPercentage,
      color: colors.mutedForeground,
    });
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card variant="elevated" style={styles.card}>
      <CardHeader style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>{monthName} Spending</Text>
        <Text style={[styles.totalAmount, { color: colors.expense }]}>{formatCurrency(totalExpenses)}</Text>
      </CardHeader>
      <CardContent>
        <View style={styles.categoryList}>
          {displayData.map((item, index) => (
            <View key={item.category}>
              <View style={styles.categoryItem}>
                <View style={styles.categoryLeft}>
                  <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.categoryName, { color: colors.foreground }]} numberOfLines={1}>
                    {item.category}
                  </Text>
                </View>
                <View style={styles.categoryRight}>
                  <Text style={[styles.categoryAmount, { color: colors.foreground }]}>
                    {formatCurrency(item.amount)}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: colors.mutedForeground }]}>
                    {item.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
              {/* Progress bar */}
              <View style={[styles.progressBarBg, { backgroundColor: colors.muted }]}>
                <View style={[styles.progressBarFill, { width: `${item.percentage}%`, backgroundColor: item.color }]} />
              </View>
              {index < displayData.length - 1 && (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing[1],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...textStyles.body,
    fontWeight: '600',
  },
  totalAmount: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  emptyText: {
    ...textStyles.caption,
    fontStyle: 'italic',
  },
  categoryList: {
    gap: spacing[2],
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[2],
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
  categoryName: {
    ...textStyles.caption,
    flex: 1,
  },
  categoryRight: {
    alignItems: 'flex-end',
    marginLeft: spacing[2],
  },
  categoryAmount: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  categoryPercentage: {
    fontSize: 10,
    marginTop: 1,
  },
  progressBarBg: {
    height: 3,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing[0.5],
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  separator: {
    height: 1,
    marginTop: spacing[1],
  },
});
