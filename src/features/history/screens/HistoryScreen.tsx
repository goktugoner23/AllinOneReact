import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { fetchTransactions, deleteTransaction } from '@features/transactions/services/transactions';
import { fetchRegistrations, fetchStudents, deleteRegistration, deleteRegistrationWithTransactions } from '@features/wtregistry/services/wtRegistry';
import { fetchInvestments, deleteInvestment } from '@features/transactions/services/investments';
import { HistoryItem, HistoryItemType } from '@features/history/types/HistoryItem';
import { Transaction } from '@features/transactions/types/Transaction';
import { WTRegistration, WTStudent } from '@features/wtregistry/types/WTRegistry';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '@App';

const FILTERS: { label: string; type: HistoryItemType }[] = [
  { label: 'Income', type: 'TRANSACTION_INCOME' },
  { label: 'Expense', type: 'TRANSACTION_EXPENSE' },
  { label: 'Investment', type: 'INVESTMENT' },
  { label: 'Registration', type: 'REGISTRATION' },
];

function transactionToHistoryItem(tx: Transaction): HistoryItem {
  return {
    id: tx.id.toString(),
    title: tx.isIncome ? `Income: ${tx.type}` : `Expense: ${tx.type}`,
    description: tx.description,
    date: tx.date,
    amount: tx.amount,
    type: tx.isIncome ? 'Income' : 'Expense',
    itemType: tx.isIncome ? 'TRANSACTION_INCOME' : 'TRANSACTION_EXPENSE',
  };
}

function registrationToHistoryItem(reg: WTRegistration, studentName: string): HistoryItem {
  return {
    id: reg.id.toString(),
    title: `Registration: ${studentName}`,
    description: 'Course Registration',
    date: reg.startDate ? reg.startDate.toISOString() : new Date().toISOString(),
    amount: reg.amount,
    type: 'Wing Tzun',
    imageUri: reg.attachmentUri,
    itemType: 'REGISTRATION',
  };
}

function investmentToHistoryItem(inv: any): HistoryItem {
  return {
    id: inv.id.toString(),
    title: inv.name,
    description: inv.description || 'Investment',
    date: inv.date,
    amount: inv.amount,
    type: inv.type,
    imageUri: inv.imageUri,
    itemType: 'INVESTMENT',
  };
}

export const HistoryScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<HistoryItemType[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    setRefreshing(true);
    try {
      const [transactions, investments, registrations, students] = await Promise.all([
        fetchTransactions(),
        fetchInvestments(),
        fetchRegistrations(),
        fetchStudents(),
      ]);
      const studentMap: Record<string, string> = {};
      students.forEach(s => {
        studentMap[s.id.toString()] = s.name;
      });
      const txItems = transactions.map(transactionToHistoryItem);
      const regItems = registrations.map(reg =>
        registrationToHistoryItem(reg, studentMap[reg.studentId.toString()] || 'Unknown')
      );
      const invItems = investments.map(investmentToHistoryItem);
      const allItems = [...txItems, ...invItems, ...regItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistoryItems(allItems);
    } catch (error) {
      setHistoryItems([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredItems = useMemo(() => {
    return historyItems.filter(item => {
      // Search filter
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        (item.amount !== undefined && item.amount.toString().includes(search));
      // Type filter
      const matchesType =
        selectedFilters.length === 0 || selectedFilters.includes(item.itemType);
      return matchesSearch && matchesType;
    });
  }, [historyItems, search, selectedFilters]);

  const toggleFilter = (type: HistoryItemType) => {
    setSelectedFilters(filters =>
      filters.includes(type)
        ? filters.filter(f => f !== type)
        : [...filters, type]
    );
  };

  const handleDelete = async (item: HistoryItem) => {
    Alert.alert(
      'Delete',
      `Are you sure you want to delete this item?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              if (item.itemType === 'TRANSACTION_INCOME' || item.itemType === 'TRANSACTION_EXPENSE') {
                await deleteTransaction(item.id);
              } else if (item.itemType === 'INVESTMENT') {
                await deleteInvestment(item.id);
              } else if (item.itemType === 'REGISTRATION') {
                await deleteRegistrationWithTransactions(Number(item.id));
              }
              loadHistory();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete item.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity onLongPress={() => handleDelete(item)} activeOpacity={0.9}>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: theme.chip }]}>
            <Ionicons
              name={
                item.itemType === 'TRANSACTION_INCOME'
                  ? 'arrow-down'
                  : item.itemType === 'TRANSACTION_EXPENSE'
                  ? 'arrow-up'
                  : item.itemType === 'INVESTMENT'
                  ? 'trending-up'
                  : 'school'
              }
              size={24}
              color={
                item.itemType === 'TRANSACTION_INCOME'
                  ? theme.income
                  : item.itemType === 'TRANSACTION_EXPENSE'
                  ? theme.expense
                  : item.itemType === 'INVESTMENT'
                  ? theme.investment
                  : theme.registration
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.description, { color: theme.text }]}>{item.description}</Text>
          </View>
          {item.amount !== undefined && (
            <Text
              style={[
                styles.amount,
                item.itemType === 'TRANSACTION_INCOME'
                  ? { color: theme.income }
                  : item.itemType === 'TRANSACTION_EXPENSE'
                  ? { color: theme.expense }
                  : item.itemType === 'INVESTMENT'
                  ? { color: theme.investment }
                  : { color: theme.registration },
              ]}
            >
              {item.amount.toLocaleString(undefined, {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
              })}
            </Text>
          )}
        </View>
        <Text style={[styles.date, { color: theme.placeholder }]}>{new Date(item.date).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
        <Text style={[styles.topBarTitle, { color: theme.text }]}>History</Text>
      </View>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.searchBar }]}>
        <Ionicons name="search" size={20} color={theme.placeholder} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search history..."
          placeholderTextColor={theme.placeholder}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close" size={20} color={theme.placeholder} />
          </TouchableOpacity>
        )}
      </View>
      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.type}
            style={[styles.chip, { backgroundColor: selectedFilters.includes(f.type) ? theme.primary : theme.chip }]}
            onPress={() => toggleFilter(f.type)}
          >
            <Text style={[styles.chipText, { color: selectedFilters.includes(f.type) ? theme.onPrimary : theme.chipText }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* History List */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadHistory} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="time" size={64} color={theme.divider} />
            <Text style={[styles.emptyText, { color: theme.divider }]}>No history yet</Text>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topBar: {
    backgroundColor: '#fff',
    paddingTop: 48,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#eee',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  chipSelected: {
    backgroundColor: '#2ecc71',
  },
  chipText: {
    color: '#666',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  income: {
    color: '#4CAF50',
  },
  expense: {
    color: '#F44336',
  },
  investment: {
    color: '#FF9800',
  },
  registration: {
    color: '#2196F3',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
  },
  emptyText: {
    fontSize: 18,
    color: '#bbb',
    marginTop: 12,
  },
});