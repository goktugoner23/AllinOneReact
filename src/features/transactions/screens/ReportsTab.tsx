import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import { fetchTransactions } from '@features/transactions/services/transactions';
import { Transaction } from '@features/transactions/types/Transaction';
import { LineChart } from 'react-native-chart-kit';
import { format, subDays, startOfYear, isAfter, parseISO } from 'date-fns';
import { TransactionCard } from '@features/transactions/components/TransactionCard';
import { TransactionService } from '@features/transactions/services/transactionService';
import { Dropdown, DropdownItem } from '@shared/components/Dropdown';
import Ionicons from 'react-native-vector-icons/Ionicons';

const dateRanges = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
];

const formatCurrencyTRY = (amount: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

function filterByDateRange(transactions: Transaction[], range: string) {
  const now = new Date();
  if (range === 'all') return transactions;
  if (range === 'year') {
    const start = startOfYear(now);
    return transactions.filter(t => isAfter(parseISO(t.date), start));
  }
  let days = 0;
  if (range === '7d') days = 7;
  if (range === '30d') days = 30;
  if (range === '90d') days = 90;
  if (days > 0) {
    const start = subDays(now, days);
    return transactions.filter(t => isAfter(parseISO(t.date), start));
  }
  return transactions;
}

export const ReportsTab: React.FC = () => {
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
        icon: cat === 'All' ? (
          <Ionicons name="apps" size={20} color="#666" />
        ) : undefined,
      })),
    [categories]
  );

  // Convert date ranges to dropdown items
  const dateRangeItems: DropdownItem[] = useMemo(
    () =>
      dateRanges.map((range) => ({
        label: range.label,
        value: range.value,
        icon: <Ionicons name="calendar-outline" size={20} color="#666" />,
      })),
    []
  );

  useEffect(() => {
    fetchTransactions(1000).then(txs => {
      setTransactions(txs);
      const cats = Array.from(new Set(txs.map(t => t.category)));
      setCategories(['All', ...cats]);
    });
  }, []);

  // Filter transactions by date range and category
  const filteredTransactions = transactions.filter(t => {
    if (category !== 'All' && t.category !== category) return false;
    return filterByDateRange([t], dateRange).length > 0;
  });

  // Sort filtered transactions by date desc (latest first)
  const sortedTransactions = filteredTransactions
    .slice()
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  // Summary statistics - updated to use isIncome field
  const totalIncome = filteredTransactions
    .filter(t => t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter(t => !t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Chart data: spending per day - updated to use isIncome field
  const chartData = (() => {
    const map: { [date: string]: number } = {};
    filteredTransactions.forEach(t => {
      const d = format(parseISO(t.date), 'MM-dd');
      map[d] = (map[d] || 0) + (!t.isIncome ? t.amount : 0);
    });
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    const labels = sorted.map(([date]) => date);
    const data = sorted.map(([_, value]) => value);
    
    return {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [{
        data: data.length > 0 ? data : [0],
        color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
        strokeWidth: 2
      }]
    };
  })();

  // Category breakdown - updated to use isIncome field
  const categorySpending = (() => {
    const map: { [cat: string]: number } = {};
    filteredTransactions.forEach(t => {
      if (!t.isIncome)
        map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  })();

  // Insights
  const avgTransaction = filteredTransactions.length
    ? filteredTransactions.reduce((sum, t) => sum + t.amount, 0) /
      filteredTransactions.length
    : 0;
  const mostFrequentCategory = (() => {
    const map: { [cat: string]: number } = {};
    filteredTransactions.forEach(t => {
      map[t.category] = (map[t.category] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  })();

  // Pagination for transactions list (apply on filtered & sorted list)
  const PAGE_SIZE = 5;
  const totalPages = sortedTransactions.length === 0 ? 0 : Math.ceil(sortedTransactions.length / PAGE_SIZE);
  const startIndex = currentPage * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, sortedTransactions.length);
  const pagedTransactions = startIndex < sortedTransactions.length ? sortedTransactions.slice(startIndex, endIndex) : [];

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

  return (
    <ScrollView style={styles.container}>
      {/* Modern Filter Section */}
      <View style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <Ionicons name="filter" size={20} color="#333" />
          <Text style={styles.filterTitle}>Filters</Text>
        </View>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Category</Text>
            <Dropdown
              items={categoryItems}
              selectedValue={category}
              onValueChange={setCategory}
              placeholder="Select Category"
            />
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <Dropdown
              items={dateRangeItems}
              selectedValue={dateRange}
              onValueChange={setDateRange}
              placeholder="Select Period"
            />
          </View>
        </View>
      </View>
      {/* Modern Summary Statistics */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Summary Statistics</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconContainer, styles.incomeIcon]}>
              <Ionicons name="arrow-down-circle" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={[styles.summaryValue, styles.incomeText]}>
              {formatCurrencyTRY(totalIncome)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconContainer, styles.expenseIcon]}>
              <Ionicons name="arrow-up-circle" size={24} color="#F44336" />
            </View>
            <Text style={styles.summaryLabel}>Total Expense</Text>
            <Text style={[styles.summaryValue, styles.expenseText]}>
              {formatCurrencyTRY(totalExpense)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconContainer, styles.balanceIcon]}>
              <Ionicons name="wallet" size={24} color="#2196F3" />
            </View>
            <Text style={styles.summaryLabel}>Net Balance</Text>
            <Text style={[styles.summaryValue, balance >= 0 ? styles.incomeText : styles.expenseText]}>
              {formatCurrencyTRY(balance)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconContainer, styles.transactionIcon]}>
              <Ionicons name="receipt" size={24} color="#FF9800" />
            </View>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={styles.summaryValue}>
              {filteredTransactions.length}
            </Text>
          </View>
        </View>
      </View>
      {/* Modern Chart Section */}
      <View style={styles.chartCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="trending-up" size={20} color="#333" />
          <Text style={styles.cardTitle}>Spending Trends</Text>
        </View>
        {chartData.datasets[0].data.length > 1 && chartData.datasets[0].data[0] !== 0 ? (
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 64}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#e74c3c'
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        ) : (
          <Text style={styles.noDataText}>No data available for chart</Text>
        )}
      </View>
      {/* Modern Category Breakdown */}
      <View style={styles.categoryCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="pie-chart" size={20} color="#333" />
          <Text style={styles.cardTitle}>Category Breakdown</Text>
        </View>
        {categorySpending.length ? (
          categorySpending.map(([cat, amt], i) => (
            <View key={cat}>
              <View style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryDot} />
                  <Text style={styles.categoryName}>{cat}</Text>
                </View>
                <Text style={styles.categoryAmount}>{formatCurrencyTRY(amt)}</Text>
              </View>
              {i < categorySpending.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No spending data available</Text>
        )}
      </View>

      {/* Modern Insights */}
      <View style={styles.insightsCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="bulb" size={20} color="#333" />
          <Text style={styles.cardTitle}>Insights</Text>
        </View>
        <View style={styles.insightRow}>
          <Ionicons name="stats-chart" size={18} color="#666" />
          <Text style={styles.insightLabel}>Average Transaction:</Text>
          <Text style={styles.insightValue}>{formatCurrencyTRY(avgTransaction)}</Text>
        </View>
        <View style={styles.insightRow}>
          <Ionicons name="star" size={18} color="#666" />
          <Text style={styles.insightLabel}>Most Frequent Category:</Text>
          <Text style={styles.insightValue}>{mostFrequentCategory}</Text>
        </View>
        <View style={styles.insightRow}>
          <Ionicons name="list" size={18} color="#666" />
          <Text style={styles.insightLabel}>Total Transactions:</Text>
          <Text style={styles.insightValue}>{filteredTransactions.length}</Text>
        </View>
      </View>

      {/* Modern Transactions List */}
      <View style={styles.transactionsCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="list-circle" size={20} color="#333" />
          <Text style={styles.cardTitle}>Transactions</Text>
        </View>
        {pagedTransactions.length === 0 ? (
          <Text style={styles.noDataText}>No transactions found</Text>
        ) : (
          <View>
            {pagedTransactions.map((t) => (
              <TransactionCard key={t.id} transaction={t} onLongPress={handleDelete} />
            ))}
            {totalPages > 1 && (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === 0 && styles.paginationButtonDisabled]}
                  onPress={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={currentPage === 0 ? '#ccc' : '#2196F3'}
                  />
                  <Text style={[styles.paginationButtonText, currentPage === 0 && styles.paginationButtonTextDisabled]}>
                    Previous
                  </Text>
                </TouchableOpacity>
                <View style={styles.pageIndicator}>
                  <Text style={styles.pageText}>
                    {currentPage + 1} / {totalPages}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === totalPages - 1 && styles.paginationButtonDisabled]}
                  onPress={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  <Text style={[styles.paginationButtonText, currentPage === totalPages - 1 && styles.paginationButtonTextDisabled]}>
                    Next
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={currentPage === totalPages - 1 ? '#ccc' : '#2196F3'}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },

  // Filter Card Styles
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Summary Card Styles
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  incomeIcon: {
    backgroundColor: '#E8F5E9',
  },
  expenseIcon: {
    backgroundColor: '#FFEBEE',
  },
  balanceIcon: {
    backgroundColor: '#E3F2FD',
  },
  transactionIcon: {
    backgroundColor: '#FFF3E0',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  incomeText: {
    color: '#4CAF50',
  },
  expenseText: {
    color: '#F44336',
  },

  // Chart Card Styles
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Category Card Styles
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e74c3c',
  },

  // Insights Card Styles
  insightsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  insightLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // Transactions Card Styles
  transactionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Common Card Styles
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  card: {
    marginBottom: 16,
  },
  divider: {
    backgroundColor: '#f0f0f0',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Pagination Styles
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    gap: 4,
  },
  paginationButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2196F3',
  },
  paginationButtonTextDisabled: {
    color: '#ccc',
  },
  pageIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  pageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
