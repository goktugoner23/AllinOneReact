import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { fetchTransactions, deleteTransaction } from '@features/transactions/services/transactions';
import { TransactionService } from '@features/transactions/services/transactionService';
import { updateInvestment, fetchInvestments, deleteInvestment } from '@features/transactions/services/investments';
import { FlashList } from '@shopify/flash-list';
import {
  fetchRegistrations,
  fetchStudents,
  deleteRegistrationWithTransactions,
} from '@features/wtregistry/services/wtRegistry';
import { HistoryItem, HistoryItemType } from '@features/history/types/HistoryItem';
import { Transaction } from '@features/transactions/types/Transaction';
import { WTRegistration } from '@features/wtregistry/types/WTRegistry';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors, spacing, radius, shadow, textStyles } from '@shared/theme';
import { Card } from '@shared/components/ui';

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
  // Convert date to ISO string, handling both Date and string types
  const getDateString = (date?: Date | string): string => {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date;
    return date.toISOString();
  };

  return {
    id: reg.id.toString(),
    title: `Registration: ${studentName}`,
    description: 'Course Registration',
    date: getDateString(reg.startDate),
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
  const colors = useColors();
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
      students.forEach((s) => {
        studentMap[s.id.toString()] = s.name;
      });
      const txItems = transactions.map(transactionToHistoryItem);
      const regItems = registrations.map((reg) =>
        registrationToHistoryItem(reg, studentMap[reg.studentId.toString()] || 'Unknown'),
      );
      const invItems = investments.map(investmentToHistoryItem);
      const allItems = [...txItems, ...invItems, ...regItems].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
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
    return historyItems.filter((item) => {
      // Search filter
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        (item.amount !== undefined && item.amount.toString().includes(search));
      // Type filter
      const matchesType = selectedFilters.length === 0 || selectedFilters.includes(item.itemType);
      return matchesSearch && matchesType;
    });
  }, [historyItems, search, selectedFilters]);

  const toggleFilter = (type: HistoryItemType) => {
    setSelectedFilters((filters) => (filters.includes(type) ? filters.filter((f) => f !== type) : [...filters, type]));
  };

  const handleDelete = async (item: HistoryItem) => {
    Alert.alert('Delete', `Are you sure you want to delete this item?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (item.itemType === 'TRANSACTION_INCOME' || item.itemType === 'TRANSACTION_EXPENSE') {
              // Revert transaction effect on investment if linked
              const txs = await fetchTransactions(1000);
              const tx = txs.find((t) => t.id === item.id);
              if (tx && (tx as any).relatedInvestmentId) {
                const invs = await fetchInvestments(1000);
                const inv = invs.find((i) => i.id === (tx as any).relatedInvestmentId);
                if (inv) {
                  const amount = tx.amount;
                  const adjustedAmount = tx.isIncome ? inv.amount + amount : inv.amount - amount;
                  await updateInvestment({ ...inv, amount: adjustedAmount, currentValue: adjustedAmount });
                }
              }
              await TransactionService.deleteTransaction(item.id);
            } else if (item.itemType === 'INVESTMENT') {
              await deleteInvestment(item.id);
            } else if (item.itemType === 'REGISTRATION') {
              await deleteRegistrationWithTransactions(Number(item.id));
            }
            loadHistory();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete item.');
          }
        },
      },
    ]);
  };

  const getItemColor = (itemType: HistoryItemType) => {
    switch (itemType) {
      case 'TRANSACTION_INCOME':
        return colors.income;
      case 'TRANSACTION_EXPENSE':
        return colors.expense;
      case 'INVESTMENT':
        return colors.investment;
      case 'REGISTRATION':
        return colors.info;
      default:
        return colors.foreground;
    }
  };

  const getItemMutedColor = (itemType: HistoryItemType) => {
    switch (itemType) {
      case 'TRANSACTION_INCOME':
        return colors.incomeMuted;
      case 'TRANSACTION_EXPENSE':
        return colors.expenseMuted;
      case 'INVESTMENT':
        return colors.investmentMuted;
      case 'REGISTRATION':
        return colors.infoMuted;
      default:
        return colors.muted;
    }
  };

  const getItemIcon = (itemType: HistoryItemType) => {
    switch (itemType) {
      case 'TRANSACTION_INCOME':
        return 'arrow-down';
      case 'TRANSACTION_EXPENSE':
        return 'arrow-up';
      case 'INVESTMENT':
        return 'trending-up';
      case 'REGISTRATION':
        return 'school';
      default:
        return 'document';
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.cardWrapper}>
      <Card variant="elevated" onLongPress={() => handleDelete(item)}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: getItemMutedColor(item.itemType) }]}>
            <Ionicons name={getItemIcon(item.itemType)} size={20} color={getItemColor(item.itemType)} />
          </View>
          <View style={styles.contentContainer}>
            <Text style={[textStyles.label, { color: colors.foreground }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]} numberOfLines={1}>
              {item.description}
            </Text>
          </View>
          {item.amount !== undefined && (
            <Text style={[textStyles.amountSmall, { color: getItemColor(item.itemType) }]}>
              {new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY',
                minimumFractionDigits: 2,
              }).format(item.amount)}
            </Text>
          )}
        </View>
        <Text style={[textStyles.caption, { color: colors.foregroundSubtle, marginTop: spacing[1] }]}>
          {new Date(item.date).toLocaleString()}
        </Text>
      </Card>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[textStyles.h4, { color: colors.foreground }]}>History</Text>
      </View>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.foregroundSubtle} style={{ marginRight: spacing[2] }} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search history..."
          placeholderTextColor={colors.foregroundSubtle}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={20} color={colors.foregroundMuted} />
          </TouchableOpacity>
        )}
      </View>
      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.type}
            style={[
              styles.chip,
              {
                backgroundColor: selectedFilters.includes(f.type) ? colors.primary : colors.secondary,
                borderColor: selectedFilters.includes(f.type) ? colors.primary : colors.border,
              },
            ]}
            onPress={() => toggleFilter(f.type)}
          >
            <Text
              style={[
                textStyles.labelSmall,
                { color: selectedFilters.includes(f.type) ? colors.primaryForeground : colors.foregroundMuted },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* History List */}
      <FlashList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadHistory} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.muted }]}>
              <Ionicons name="time-outline" size={48} color={colors.foregroundSubtle} />
            </View>
            <Text style={[textStyles.body, { color: colors.foregroundMuted, marginTop: spacing[4] }]}>
              No history yet
            </Text>
            <Text style={[textStyles.bodySmall, { color: colors.foregroundSubtle, marginTop: spacing[1] }]}>
              Your transactions will appear here
            </Text>
          </View>
        }
        estimatedItemSize={100}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingTop: spacing[12], // 48px for status bar
    paddingBottom: spacing[4],
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing[4],
    borderRadius: radius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    ...shadow.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing[1],
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1.5],
    borderWidth: 1,
  },
  cardWrapper: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: spacing[10], // 40px
    height: spacing[10],
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  contentContainer: {
    flex: 1,
    marginRight: spacing[2],
  },
  listContent: {
    paddingTop: spacing[2],
    paddingBottom: spacing[6],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[20],
  },
  emptyIconCircle: {
    width: spacing[24], // 96px
    height: spacing[24],
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
