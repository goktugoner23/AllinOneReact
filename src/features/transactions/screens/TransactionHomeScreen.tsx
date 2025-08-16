import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";

import { FlashList } from '@shopify/flash-list';
import { fetchTransactions } from "@features/transactions/services/transactions";
import { Transaction } from "@features/transactions/types/Transaction";
import { BalanceCard } from "@features/transactions/components/BalanceCard";
import { TransactionForm } from "@features/transactions/components/TransactionForm";
import { SpendingPieChart } from "@features/transactions/components/SpendingPieChart";
import { logger } from "@shared/utils/logger";
import { useBalance } from "@features/transactions/store/balanceHooks";

type ListItem =
  | {
      type: "balance";
      data: { showLoading?: boolean };
    }
  | { type: "chart"; data: { transactions: Transaction[] } }
  | { type: "form"; data: { onTransactionAdded: () => void } };

export const TransactionHomeScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Use the new balance system with enhanced cache invalidation
  const { forceRefreshBalance, markStale } = useBalance();

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







  const handleTransactionAdded = () => {
    // Mark balance as stale when new transaction is added
    markStale();
    // Force refresh like Kotlin app to ensure UI consistency
    forceRefreshTransactions();
  };



  const listData: ListItem[] = [
    { type: "balance", data: { showLoading: refreshing } },
    { type: "chart", data: { transactions } },
    { type: "form", data: { onTransactionAdded: handleTransactionAdded } },
  ];

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
        estimatedItemSize={231}
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

});
