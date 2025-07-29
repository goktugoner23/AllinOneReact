import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Transaction } from '../types/Transaction';

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
  // Only consider expenses for the pie chart
  const expenses = transactions.filter(t => !t.isIncome);
  
  if (expenses.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Transaction Summary</Text>
        <View style={styles.chartContainer}>
          <Text style={styles.noDataText}>No transactions to display</Text>
        </View>
      </View>
    );
  }

  // Group expenses by category and calculate totals
  const categoryTotals = expenses.reduce((acc, transaction) => {
    const category = transaction.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

  // Convert to array and sort by amount
  const categoryData: CategoryData[] = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalExpenses) * 100
    }))
    .sort((a, b) => b.amount - a.amount)
    .map((item, index) => ({
      ...item,
      color: getCategoryColor(index)
    }));

  // Take top 5 categories and group the rest as "Others"
  const displayData = categoryData.slice(0, 5);
  if (categoryData.length > 5) {
    const othersAmount = categoryData.slice(5).reduce((sum, item) => sum + item.amount, 0);
    const othersPercentage = (othersAmount / totalExpenses) * 100;
    displayData.push({
      category: 'Others',
      amount: othersAmount,
      percentage: othersPercentage,
      color: '#808080'
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction Summary</Text>
      <View style={styles.chartContainer}>
        {/* Simple pie chart representation with colored boxes */}
        <View style={styles.pieChart}>
          {displayData.map((item, index) => (
            <View key={item.category} style={styles.pieSlice}>
              <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{item.category}</Text>
                <Text style={styles.categoryAmount}>
                  ${item.amount.toFixed(2)} ({item.percentage.toFixed(1)}%)
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const getCategoryColor = (index: number): string => {
  const colors = [
    '#6200EE', // Purple
    '#03DAC6', // Teal
    '#FF6B6B', // Red
    '#4ECDC4', // Light Blue
    '#45B7D1', // Blue
    '#96CEB4', // Light Green
    '#FFCE56', // Yellow
    '#FF8A65', // Orange
    '#BA68C8', // Light Purple
    '#81C784'  // Green
  ];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  chartContainer: {
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  pieChart: {
    width: '100%',
  },
  pieSlice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  categoryAmount: {
    fontSize: 12,
    color: '#666',
  },
  noDataText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    fontStyle: 'italic',
  },
}); 