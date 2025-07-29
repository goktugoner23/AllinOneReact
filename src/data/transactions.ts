import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { getDb, getDeviceId } from "./firebase";
import { firebaseIdManager } from "./firebaseIdManager";
import { Transaction } from "../types/Transaction";
import { logger } from "../utils/logger";

export async function addTransaction(
  transaction: Omit<Transaction, "id">,
): Promise<void> {
  try {
    const db = getDb();
    const deviceId = await getDeviceId();
    const transactionId = await firebaseIdManager.getNextId("transactions");

    const transactionData = {
      id: transactionId,
      amount: transaction.amount,
      type: transaction.type, // Category name (same as category)
      description: transaction.description || "", // Ensure not null like Kotlin
      isIncome: transaction.isIncome,
      date: transaction.date,
      category: transaction.category,
      relatedRegistrationId: transaction.relatedRegistrationId,
      deviceId: deviceId,
    };

    await setDoc(
      doc(db, "transactions", transactionId.toString()),
      transactionData,
    );
  } catch (error) {
    logger.error("Error adding transaction", error, "addTransaction");
    throw error;
  }
}

export async function updateTransaction(
  transaction: Transaction,
): Promise<void> {
  try {
    const db = getDb();
    const deviceId = await getDeviceId();

    const transactionData = {
      id: transaction.id,
      amount: transaction.amount,
      type: transaction.type, // Category name (same as category)
      description: transaction.description || "", // Ensure not null like Kotlin
      isIncome: transaction.isIncome,
      date: transaction.date,
      category: transaction.category,
      relatedRegistrationId: transaction.relatedRegistrationId,
      deviceId: deviceId,
    };

    await setDoc(doc(db, "transactions", transaction.id), transactionData);
  } catch (error) {
    logger.error("Error updating transaction", error, "updateTransaction");
    throw error;
  }
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  try {
    const db = getDb();
    await deleteDoc(doc(db, "transactions", transactionId));
  } catch (error) {
    logger.error("Error deleting transaction", error, "deleteTransaction");
    throw error;
  }
}

export async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const db = getDb();
    const deviceId = await getDeviceId();

    logger.debug("Fetching transactions", { deviceId }, "fetchTransactions");

    // First, let's try to get ALL transactions to see what's in the database
    const allTransactionsQuery = query(collection(db, "transactions"));
    const allSnapshot = await getDocs(allTransactionsQuery);

    logger.debug(
      "Total transactions in database",
      { count: allSnapshot.docs.length },
      "fetchTransactions",
    );

    // Log all transactions to see their structure
    if (__DEV__) {
      allSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        logger.debug(
          `Transaction ${index + 1}`,
          {
            id: doc.id,
            deviceId: data.deviceId,
            amount: data.amount,
            type: data.type,
            isIncome: data.isIncome,
            date: data.date,
          },
          "fetchTransactions",
        );
      });
    }

    // Now try to get transactions for this device
    const q = query(
      collection(db, "transactions"),
      where("deviceId", "==", deviceId),
    );

    const snapshot = await getDocs(q);
    logger.debug(
      "Transactions for this device",
      { count: snapshot.docs.length },
      "fetchTransactions",
    );

    let transactions: Transaction[] = [];

    // If no transactions found for this device, try to get all transactions (fallback)
    if (snapshot.docs.length === 0) {
      logger.debug(
        "No transactions found for device, trying to fetch all transactions",
        {},
        "fetchTransactions",
      );
      const allTransactions = allSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: data.id?.toString() ?? doc.id,
          amount: data.amount ?? 0,
          type: data.type ?? "", // Category name
          description: data.description ?? "", // Ensure not null like Kotlin
          isIncome: data.isIncome ?? false,
          date:
            data.date instanceof Timestamp
              ? data.date.toDate().toISOString()
              : data.date?.toDate?.()
                ? data.date.toDate().toISOString()
                : new Date().toISOString(),
          category: data.category ?? "",
          relatedRegistrationId: data.relatedRegistrationId,
        };
      });
      transactions = allTransactions;
    } else {
      // Map data exactly like Kotlin app
      transactions = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: data.id?.toString() ?? doc.id,
          amount: data.amount ?? 0,
          type: data.type ?? "", // Category name
          description: data.description ?? "", // Ensure not null like Kotlin
          isIncome: data.isIncome ?? false,
          date:
            data.date instanceof Timestamp
              ? data.date.toDate().toISOString()
              : data.date?.toDate?.()
                ? data.date.toDate().toISOString()
                : new Date().toISOString(),
          category: data.category ?? "",
          relatedRegistrationId: data.relatedRegistrationId,
        };
      });
    }

    logger.debug(
      "Mapped transactions",
      { count: transactions.length },
      "fetchTransactions",
    );

    // Sort by date descending in memory (like Kotlin app)
    const sortedTransactions = transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    logger.debug(
      "Final sorted transactions",
      { count: sortedTransactions.length },
      "fetchTransactions",
    );
    return sortedTransactions;
  } catch (error) {
    logger.error("Error fetching transactions", error, "fetchTransactions");
    return [];
  }
}
