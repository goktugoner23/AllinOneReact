import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Text, Button, Menu, Divider } from 'react-native-paper';
import { fetchTransactions } from '@features/transactions/services/transactions';
import { Transaction } from '@features/transactions/types/Transaction';
import { LineChart } from 'react-native-chart-kit';
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

export const ReportsTab: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState('30d');
  const [category, setCategory] = useState('All');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [dateRangeMenuVisible, setDateRangeMenuVisible] = useState(false);
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

  return (
    <ScrollView style={styles.container}>
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
            <Menu
              visible={dateRangeMenuVisible}
              onDismiss={() => setDateRangeMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  style={styles.marginLeft8}
                  onPress={() => setDateRangeMenuVisible(true)}
                >
                  {dateRanges.find(r => r.value === dateRange)?.label}
                </Button>
              }
            >
              {dateRanges.map(range => (
                <Menu.Item
                  key={range.value}
                  onPress={() => {
                    setDateRange(range.value);
                    setDateRangeMenuVisible(false);
                  }}
                  title={range.label}
                />
              ))}
            </Menu>
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
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  flex1: {
    flex: 1,
  },
  expenseRedBold: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  marginVertical4: {
    marginVertical: 4,
  },
});
