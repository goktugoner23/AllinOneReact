import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Button,
  Alert,
} from "react-native";
import { FlashList } from '@shopify/flash-list';
import { fetchTransactions } from "@features/transactions/services/transactions";
import { TransactionService } from "@features/transactions/services/transactionService";
import { Transaction } from "@features/transactions/types/Transaction";
import { BalanceCard } from "@features/transactions/components/BalanceCard";
import { TransactionCard } from "@features/transactions/components/TransactionCard";
import { TransactionForm } from "@features/transactions/components/TransactionForm";
import { SpendingPieChart } from "@features/transactions/components/SpendingPieChart";
import { logger } from "@shared/utils/logger";
import { useBalance } from "@features/transactions/store/balanceHooks";

const PAGE_SIZE = 5;

type ListItem =
  | {
      type: "balance";
      data: { showLoading?: boolean };
    }
  | { type: "chart"; data: { transactions: Transaction[] } }
  | { type: "form"; data: { onTransactionAdded: () => void } }
  | { type: "transactions-header"; data: {} }
  | {
      type: "transactions";
      data: {
        transactions: Transaction[];
        onDelete: (transaction: Transaction) => void;
      };
    }
  | {
      type: "pagination";
      data: {
        currentPage: number;
        totalPages: number;
        onPrevious: () => void;
        onNext: () => void;
      };
    };

export const TransactionHomeScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Use the new balance system with enhanced cache invalidation
  const { forceRefreshBalance, updateBalance, markStale } = useBalance();

  // Force refresh transactions when this screen is first displayed (like Kotlin app)
  useEffect(() => {
    forceRefreshTransactions();
  }, []);

  const forceRefreshTransactions = useCallback(async () => {
    logger.debug("Force refreshing transactions", {}, "TransactionHomeScreen");
    setRefreshing(true);
    try {
      // Fetch fresh transactions first
      const txs = await fetchTransactions();
      // Sort by date descending like Kotlin app
      const sortedTransactions = txs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setTransactions(sortedTransactions);
      setCurrentPage(0);
      
      // Force refresh balance with cache invalidation
      await forceRefreshBalance();
      
      logger.debug(
        "Force refresh completed",
        { count: sortedTransactions.length },
        "TransactionHomeScreen",
      );
    } catch (error) {
      logger.error(
        "Error force refreshing transactions",
        error,
        "TransactionHomeScreen",
      );
      Alert.alert("Error", "Failed to load transactions");
    } finally {
      setRefreshing(false);
    }
  }, [forceRefreshBalance]);

  const loadTransactions = useCallback(async () => {
    await forceRefreshTransactions();
  }, [forceRefreshTransactions]);

  // Pagination logic - exactly like Kotlin app
  const totalPages =
    transactions.length === 0 ? 0 : Math.ceil(transactions.length / PAGE_SIZE);
  const startIndex = currentPage * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, transactions.length);
  const pagedTransactions =
    startIndex < transactions.length
      ? transactions.slice(startIndex, endIndex)
      : [];

  // Balance calculation - now handled by Redux store with caching
  // These are fallback calculations if Redux store is not available
  const totalIncome = transactions
    .filter((t) => t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => !t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleDelete = async (transaction: Transaction) => {
    Alert.alert(
      "Delete Transaction",
      `Are you sure you want to delete this ${transaction.isIncome ? "income" : "expense"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await TransactionService.deleteTransaction(transaction.id);
              await forceRefreshTransactions(); // Force refresh like Kotlin app
            } catch (error) {
              logger.error(
                "Error deleting transaction",
                error,
                "TransactionHomeScreen",
              );
              Alert.alert("Error", "Failed to delete transaction");
            }
          },
        },
      ],
    );
  };

  const handleTransactionAdded = () => {
    // Mark balance as stale when new transaction is added
    markStale();
    // Force refresh like Kotlin app to ensure UI consistency
    forceRefreshTransactions();
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const listData: ListItem[] = [
    { type: "balance", data: { showLoading: refreshing } },
    { type: "chart", data: { transactions } },
    { type: "form", data: { onTransactionAdded: handleTransactionAdded } },
    {
      type: "transactions",
      data: { transactions: pagedTransactions, onDelete: handleDelete },
    },
  ];

  // Add pagination if needed - exactly like Kotlin app
  if (totalPages > 1) {
    listData.push({
      type: "pagination",
      data: {
        currentPage,
        totalPages,
        onPrevious: handlePreviousPage,
        onNext: handleNextPage,
      },
    });
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={listData}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        renderItem={({ item }) => {
          switch (item.type) {
            case "balance":
              return (
                <BalanceCard
                  showLoading={item.data.showLoading}
                />
              );
            case "chart":
              return <SpendingPieChart transactions={item.data.transactions} />;
            case "form":
              return (
                <TransactionForm
                  onTransactionAdded={item.data.onTransactionAdded}
                />
              );

            case "transactions":
              return (
                <View style={styles.transactionsSection}>
                  {item.data.transactions.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.empty}>No transactions found</Text>
                    </View>
                  ) : (
                    item.data.transactions.map((transaction: Transaction) => (
                      <TransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        onLongPress={item.data.onDelete}
                      />
                    ))
                  )}
                </View>
              );
            case "pagination":
              return (
                <View style={styles.pagination}>
                  <Button
                    title="Previous"
                    onPress={item.data.onPrevious}
                    disabled={item.data.currentPage === 0}
                  />
                  <Text style={styles.pageText}>
                    {item.data.currentPage + 1} / {item.data.totalPages}
                  </Text>
                  <Button
                    title="Next"
                    onPress={item.data.onNext}
                    disabled={
                      item.data.currentPage === item.data.totalPages - 1
                    }
                  />
                </View>
              );
            default:
              return null;
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={forceRefreshTransactions} // Use force refresh like Kotlin app
          />
        }
        estimatedItemSize={100}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  transactionsHeader: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  transactionsSection: {
    marginTop: 8,
  },
  emptyContainer: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    textAlign: "center",
    color: "#888",
    fontSize: 16,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  pageText: {
    marginHorizontal: 16,
    fontWeight: "bold",
    color: "#333",
  },
});
