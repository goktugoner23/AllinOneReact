import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Menu, Divider } from 'react-native-paper';
import { fetchTransactions } from '../data/transactions';
import { Transaction } from '../types/Transaction';
import { LineChart, Grid, YAxis, XAxis } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { format, subDays, startOfYear, isAfter, parseISO } from 'date-fns';

const dateRanges = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
];

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

export const ReportsScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState('30d');
  const [category, setCategory] = useState('All');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [categories, setCategories] = useState<string[]>(['All']);

  useEffect(() => {
    fetchTransactions().then(txs => {
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

  // Summary statistics
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Chart data: spending per day
  const chartData = (() => {
    const map: { [date: string]: number } = {};
    filteredTransactions.forEach(t => {
      const d = format(parseISO(t.date), 'yyyy-MM-dd');
      map[d] = (map[d] || 0) + (t.type === 'expense' ? t.amount : 0);
    });
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    return sorted.map(([_, value]) => value);
  })();
  const chartLabels = (() => {
    const map: { [date: string]: number } = {};
    filteredTransactions.forEach(t => {
      const d = format(parseISO(t.date), 'yyyy-MM-dd');
      map[d] = (map[d] || 0) + (t.type === 'expense' ? t.amount : 0);
    });
    return Object.keys(map).sort();
  })();

  // Category breakdown
  const categorySpending = (() => {
    const map: { [cat: string]: number } = {};
    filteredTransactions.forEach(t => {
      if (t.type === 'expense')
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

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Transaction Reports
      </Text>
      <Card style={styles.card}>
        <Card.Title title="Filters" />
        <Card.Content>
          <View style={styles.filterRow}>
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setCategoryMenuVisible(true)}
                >
                  {category}
                </Button>
              }
            >
              {categories.map(cat => (
                <Menu.Item
                  key={cat}
                  onPress={() => {
                    setCategory(cat);
                    setCategoryMenuVisible(false);
                  }}
                  title={cat}
                />
              ))}
            </Menu>
            <Button
              mode="outlined"
              style={styles.marginLeft8}
              onPress={() => {
                // Cycle through date ranges
                const idx = dateRanges.findIndex(r => r.value === dateRange);
                setDateRange(dateRanges[(idx + 1) % dateRanges.length].value);
              }}
            >
              {dateRanges.find(r => r.value === dateRange)?.label}
            </Button>
          </View>
        </Card.Content>
      </Card>
      <Card style={styles.card}>
        <Card.Title title="Summary Statistics" />
        <Card.Content>
          <Text>Total Income: {totalIncome.toFixed(2)}</Text>
          <Text>Total Expense: {totalExpense.toFixed(2)}</Text>
          <Text>Balance: {balance.toFixed(2)}</Text>
          <Text>Transactions: {filteredTransactions.length}</Text>
        </Card.Content>
      </Card>
      <Card style={styles.card}>
        <Card.Title title="Spending Trends" />
        <Card.Content>
          {chartData.length > 1 ? (
            <View style={styles.chartRow}>
              <YAxis
                data={chartData}
                contentInset={{ top: 20, bottom: 20 }}
                svg={{ fontSize: 10, fill: 'grey' }}
                numberOfTicks={5}
                formatLabel={(value: number) => value.toFixed(0)}
              />
              <View style={styles.flex1MarginLeft10}>
                <LineChart
                  style={styles.flex1}
                  data={chartData}
                  svg={{ stroke: '#e74c3c', strokeWidth: 2 }}
                  contentInset={{ top: 20, bottom: 20 }}
                  curve={shape.curveMonotoneX}
                >
                  <Grid />
                </LineChart>
                <XAxis
                  style={styles.marginTop8}
                  data={chartData}
                  formatLabel={(_: number, i: number) =>
                    chartLabels[i]?.slice(5) || ''
                  }
                  contentInset={{ left: 10, right: 10 }}
                  svg={{ fontSize: 10, fill: 'grey' }}
                />
              </View>
            </View>
          ) : (
            <Text>No data for chart.</Text>
          )}
        </Card.Content>
      </Card>
      <Card style={styles.card}>
        <Card.Title title="Category Breakdown" />
        <Card.Content>
          {categorySpending.length ? (
            categorySpending.map(([cat, amt], i) => (
              <View key={cat} style={styles.categoryRow}>
                <Text style={styles.flex1}>{cat}</Text>
                <Text style={styles.expenseRedBold}>{amt.toFixed(2)}</Text>
                {i < categorySpending.length - 1 && (
                  <Divider style={styles.marginVertical4} />
                )}
              </View>
            ))
          ) : (
            <Text>No spending data available</Text>
          )}
        </Card.Content>
      </Card>
      <Card style={styles.card}>
        <Card.Title title="Insights" />
        <Card.Content>
          <Text>Average Transaction: {avgTransaction.toFixed(2)}</Text>
          <Text>Most Frequent Category: {mostFrequentCategory}</Text>
          <Text>Total Transactions: {filteredTransactions.length}</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  marginLeft8: {
    marginLeft: 8,
  },
  chartRow: {
    height: 200,
    flexDirection: 'row',
  },
  flex1MarginLeft10: {
    flex: 1,
    marginLeft: 10,
  },
  flex1: {
    flex: 1,
  },
  marginTop8: {
    marginTop: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  expenseRedBold: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  marginVertical4: {
    marginVertical: 4,
  },
});
