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
import { getDb } from "./firebase";
import { firebaseIdManager } from "./firebaseIdManager";
import { Transaction } from "../types/Transaction";
import { logger } from "../utils/logger";

export async function addTransaction(
  transaction: Omit<Transaction, "id">,
): Promise<void> {
  try {
    const db = getDb();
    const transactionId = await firebaseIdManager.getNextId("transactions");

    const transactionData = {
      id: transactionId,
      amount: transaction.amount,
      type: transaction.type, // Category name (same as category)
      description: transaction.description || "", // Ensure not null like Kotlin
      isIncome: transaction.isIncome,
      date: transaction.date,
      category: transaction.category,
      ...(transaction.relatedRegistrationId !== undefined && {
        relatedRegistrationId: transaction.relatedRegistrationId,
      }),
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

    const transactionData = {
      id: transaction.id,
      amount: transaction.amount,
      type: transaction.type, // Category name (same as category)
      description: transaction.description || "", // Ensure not null like Kotlin
      isIncome: transaction.isIncome,
      date: transaction.date,
      category: transaction.category,
      ...(transaction.relatedRegistrationId !== undefined && {
        relatedRegistrationId: transaction.relatedRegistrationId,
      }),
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

    logger.debug("Fetching all transactions", {}, "fetchTransactions");

    // Get all transactions without device filtering
    const q = query(collection(db, "transactions"));
    const snapshot = await getDocs(q);

    logger.debug(
      "Total transactions in database",
      { count: snapshot.docs.length },
      "fetchTransactions",
    );

    // Map data exactly like Kotlin app
    const transactions = snapshot.docs.map((doc) => {
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
