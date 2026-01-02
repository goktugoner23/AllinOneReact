import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { Card, Text, Divider, Button } from 'react-native-paper';
import { fetchTransactions } from '@features/transactions/services/transactions';
import { Transaction } from '@features/transactions/types/Transaction';
import { LineChart } from 'react-native-chart-kit';
import { format, subDays, startOfYear, startOfDay } from 'date-fns';
import { TransactionCard } from '@features/transactions/components/TransactionCard';
import { TransactionService } from '@features/transactions/services/transactionService';
import { useColors, useIsDark, spacing, textStyles, radius, shadow } from '@shared/theme';
import { Dropdown, DropdownItem } from '@shared/components/Dropdown';
import Ionicons from 'react-native-vector-icons/Ionicons';

const dateRanges = [
  { label: 'Last 7', value: '7d' },
  { label: 'Last 30', value: '30d' },
  { label: 'Last 90', value: '90d' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
];

const formatCurrencyTRY = (amount: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

// Get the start date for a given range (computed once, not per-transaction)
function getStartDateForRange(range: string): number | null {
  const now = new Date();
  if (range === 'all') return null; // No filtering
  if (range === 'year') return startOfYear(now).getTime();
  
  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
  const days = daysMap[range];
  if (days) return startOfDay(subDays(now, days)).getTime();
  
  return null;
}

export const ReportsTab: React.FC = () => {
  const colors = useColors();
  const isDark = useIsDark();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState('30d');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [currentPage, setCurrentPage] = useState(0);

  // Convert categories to dropdown items
  const categoryItems: DropdownItem[] = useMemo(
    () =>
      categories.map((cat) => ({
        label: cat,
        value: cat,
        icon: cat === 'All' ? <Ionicons name="apps" size={20} color={colors.mutedForeground} /> : undefined,
      })),
    [categories, colors.mutedForeground],
  );

  // Convert date ranges to dropdown items
  const dateRangeItems: DropdownItem[] = useMemo(
    () =>
      dateRanges.map((range) => ({
        label: range.label,
        value: range.value,
        icon: <Ionicons name="calendar-outline" size={20} color={colors.mutedForeground} />,
      })),
    [colors.mutedForeground],
  );

  useEffect(() => {
    fetchTransactions(1000).then((txs) => {
      setTransactions(txs);
      const cats = Array.from(new Set(txs.map((t) => t.category)));
      setCategories(['All', ...cats]);
    });
  }, []);

  // Memoize filtered and sorted transactions - this is the main performance fix
  const { filteredTransactions, sortedTransactions } = useMemo(() => {
    // Get start date threshold once for the entire filter operation
    const startTimestamp = getStartDateForRange(dateRange);
    
    // Filter transactions efficiently (single pass)
    const filtered = transactions.filter((t) => {
      // Category filter
      if (category !== 'All' && t.category !== category) return false;
      
      // Date filter - compare timestamps directly (no parsing per iteration)
      if (startTimestamp !== null) {
        const txTime = new Date(t.date).getTime();
        if (txTime < startTimestamp) return false;
      }
      
      return true;
    });
    
    // Sort by date descending (parse once per transaction)
    const sorted = filtered
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return { filteredTransactions: filtered, sortedTransactions: sorted };
  }, [transactions, dateRange, category]);

  // Memoize summary statistics
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    // Single pass through filtered transactions
    for (const t of filteredTransactions) {
      if (t.isIncome) {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    }
    
    return { totalIncome: income, totalExpense: expense, balance: income - expense };
  }, [filteredTransactions]);

  // Memoize chart data
  const chartData = useMemo(() => {
    const map: { [date: string]: number } = {};
    
    for (const t of filteredTransactions) {
      if (!t.isIncome) {
        const d = format(new Date(t.date), 'MM-dd');
        map[d] = (map[d] || 0) + t.amount;
      }
    }
    
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    const labels = sorted.map(([date]) => date);
    const data = sorted.map(([_, value]) => value);

    return {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [
        {
          data: data.length > 0 ? data : [0],
          color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [filteredTransactions]);

  // Memoize category breakdown
  const categorySpending = useMemo(() => {
    const map: { [cat: string]: number } = {};
    
    for (const t of filteredTransactions) {
      if (!t.isIncome) {
        map[t.category] = (map[t.category] || 0) + t.amount;
      }
    }
    
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredTransactions]);

  // Memoize insights
  const { avgTransaction, mostFrequentCategory } = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return { avgTransaction: 0, mostFrequentCategory: 'N/A' };
    }
    
    let totalAmount = 0;
    const categoryCount: { [cat: string]: number } = {};
    
    for (const t of filteredTransactions) {
      totalAmount += t.amount;
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    }
    
    const avg = totalAmount / filteredTransactions.length;
    const mostFrequent = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    return { avgTransaction: avg, mostFrequentCategory: mostFrequent };
  }, [filteredTransactions]);

  // Pagination for transactions list (apply on filtered & sorted list)
  const PAGE_SIZE = 5;
  const totalPages = sortedTransactions.length === 0 ? 0 : Math.ceil(sortedTransactions.length / PAGE_SIZE);
  const startIndex = currentPage * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, sortedTransactions.length);
  const pagedTransactions =
    startIndex < sortedTransactions.length ? sortedTransactions.slice(startIndex, endIndex) : [];

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [dateRange, category]);

  const handleDelete = async (transaction: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ${transaction.isIncome ? 'income' : 'expense'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await TransactionService.deleteTransaction(transaction.id);
            const fresh = await fetchTransactions(1000);
            setTransactions(fresh);
            setCurrentPage(0);
          },
        },
      ],
    );
  };

  // Dynamic chart config based on theme
  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      const r = parseInt(colors.expense.slice(1, 3), 16);
      const g = parseInt(colors.expense.slice(3, 5), 16);
      const b = parseInt(colors.expense.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    labelColor: (opacity = 1) => {
      const r = parseInt(colors.foreground.slice(1, 3), 16);
      const g = parseInt(colors.foreground.slice(3, 5), 16);
      const b = parseInt(colors.foreground.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    style: {
      borderRadius: radius.lg,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.expense,
    },
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filters Card */}
      <Card style={[styles.card, { backgroundColor: colors.card }, shadow.sm]} mode="elevated">
        <Card.Title title="Filters" titleStyle={[styles.cardTitle, { color: colors.foreground }]} />
        <Card.Content>
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Category</Text>
              <Dropdown
                items={categoryItems}
                selectedValue={category}
                onValueChange={setCategory}
                placeholder="Select Category"
              />
            </View>
            <View style={styles.filterItem}>
              <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Date Range</Text>
              <Dropdown
                items={dateRangeItems}
                selectedValue={dateRange}
                onValueChange={setDateRange}
                placeholder="Select Period"
              />
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Summary Statistics Card */}
      <Card style={[styles.card, { backgroundColor: colors.card }, shadow.sm]} mode="elevated">
        <Card.Title title="Summary Statistics" titleStyle={[styles.cardTitle, { color: colors.foreground }]} />
        <Card.Content style={styles.summaryContent}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total Income</Text>
              <Text style={[styles.summaryValue, { color: colors.income }]}>{formatCurrencyTRY(totalIncome)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total Expense</Text>
              <Text style={[styles.summaryValue, { color: colors.expense }]}>{formatCurrencyTRY(totalExpense)}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Balance</Text>
              <Text style={[styles.summaryValue, { color: balance >= 0 ? colors.income : colors.expense }]}>
                {formatCurrencyTRY(balance)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Transactions</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{filteredTransactions.length}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Spending Trends Card */}
      <Card style={[styles.card, { backgroundColor: colors.card }, shadow.sm]} mode="elevated">
        <Card.Title title="Spending Trends" titleStyle={[styles.cardTitle, { color: colors.foreground }]} />
        <Card.Content>
          {chartData.datasets[0].data.length > 1 && chartData.datasets[0].data[0] !== 0 ? (
            <LineChart
              data={chartData}
              width={Dimensions.get('window').width - spacing[16]}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No data for chart.</Text>
          )}
        </Card.Content>
      </Card>

      {/* Category Breakdown Card */}
      <Card style={[styles.card, { backgroundColor: colors.card }, shadow.sm]} mode="elevated">
        <Card.Title title="Category Breakdown" titleStyle={[styles.cardTitle, { color: colors.foreground }]} />
        <Card.Content>
          {categorySpending.length ? (
            categorySpending.map(([cat, amt], i) => (
              <View key={cat}>
                <View style={styles.categoryRow}>
                  <Text style={[styles.categoryText, { color: colors.foreground }]}>{cat}</Text>
                  <Text style={[styles.categoryAmount, { color: colors.expense }]}>{formatCurrencyTRY(amt)}</Text>
                </View>
                {i < categorySpending.length - 1 && (
                  <Divider style={[styles.categoryDivider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No spending data available</Text>
          )}
        </Card.Content>
      </Card>

      {/* Insights Card */}
      <Card style={[styles.card, { backgroundColor: colors.card }, shadow.sm]} mode="elevated">
        <Card.Title title="Insights" titleStyle={[styles.cardTitle, { color: colors.foreground }]} />
        <Card.Content style={styles.insightsContent}>
          <View style={styles.insightRow}>
            <Text style={[styles.insightLabel, { color: colors.mutedForeground }]}>Average Transaction</Text>
            <Text style={[styles.insightValue, { color: colors.foreground }]}>{formatCurrencyTRY(avgTransaction)}</Text>
          </View>
          <View style={styles.insightRow}>
            <Text style={[styles.insightLabel, { color: colors.mutedForeground }]}>Most Frequent Category</Text>
            <Text style={[styles.insightValue, { color: colors.foreground }]}>{mostFrequentCategory}</Text>
          </View>
          <View style={styles.insightRow}>
            <Text style={[styles.insightLabel, { color: colors.mutedForeground }]}>Total Transactions</Text>
            <Text style={[styles.insightValue, { color: colors.foreground }]}>{filteredTransactions.length}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Transactions list (date-desc, paginated) */}
      <Card style={[styles.card, { backgroundColor: colors.card }, shadow.sm]} mode="elevated">
        <Card.Title title="Transactions" titleStyle={[styles.cardTitle, { color: colors.foreground }]} />
        <Card.Content>
          {pagedTransactions.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions found</Text>
          ) : (
            <View>
              {pagedTransactions.map((t) => (
                <TransactionCard key={t.id} transaction={t} onLongPress={handleDelete} />
              ))}
              {totalPages > 1 && (
                <View style={styles.pagination}>
                  <Button
                    mode="contained"
                    onPress={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    buttonColor={colors.primary}
                    textColor={colors.primaryForeground}
                    style={styles.paginationButton}
                  >
                    Previous
                  </Button>
                  <Text style={[styles.pageText, { color: colors.foreground }]}>
                    {currentPage + 1} / {totalPages}
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                    buttonColor={colors.primary}
                    textColor={colors.primaryForeground}
                    style={styles.paginationButton}
                  >
                    Next
                  </Button>
                </View>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing[4],
  },
  card: {
    marginBottom: spacing[4],
    borderRadius: radius.lg,
  },
  cardTitle: {
    ...textStyles.h4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    ...textStyles.caption,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryContent: {
    gap: spacing[3],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    ...textStyles.caption,
    marginBottom: spacing[1],
  },
  summaryValue: {
    ...textStyles.amountSmall,
  },
  chart: {
    marginVertical: spacing[2],
    borderRadius: radius.lg,
  },
  emptyText: {
    ...textStyles.bodySmall,
    textAlign: 'center',
    paddingVertical: spacing[4],
    fontStyle: 'italic',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  categoryText: {
    ...textStyles.body,
    flex: 1,
  },
  categoryAmount: {
    ...textStyles.label,
    fontWeight: '700',
  },
  categoryDivider: {
    marginVertical: spacing[1],
  },
  insightsContent: {
    gap: spacing[2],
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  insightLabel: {
    ...textStyles.bodySmall,
  },
  insightValue: {
    ...textStyles.label,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[4],
    gap: spacing[3],
  },
  paginationButton: {
    borderRadius: radius.md,
  },
  pageText: {
    ...textStyles.label,
    marginHorizontal: spacing[4],
  },
});
