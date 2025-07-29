import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { getDb } from './firestore';
import { getDeviceId } from './deviceId';
import { Transaction } from '../types/Transaction';

let nextTransactionId = 1;

// Get next sequential ID for transactions
async function getNextTransactionId(): Promise<number> {
  const db = getDb();
  const deviceId = await getDeviceId();
  
  try {
    const q = query(
      collection(db, 'transactions'),
      where('deviceId', '==', deviceId),
      orderBy('id', 'desc')
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0];
      const lastId = lastDoc.data().id || 0;
      nextTransactionId = lastId + 1;
    }
  } catch (error) {
    console.warn('Failed to get last transaction ID, using fallback:', error);
  }
  
  return nextTransactionId++;
}

export async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const db = getDb();
    const deviceId = await getDeviceId();
    
    const q = query(
      collection(db, 'transactions'),
      where('deviceId', '==', deviceId),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id?.toString() ?? doc.id,
        amount: data.amount ?? 0,
        description: data.description ?? '',
        category: data.category ?? '',
        date: data.date instanceof Timestamp 
          ? data.date.toDate().toISOString() 
          : (data.date?.toDate?.() ? data.date.toDate().toISOString() : new Date().toISOString()),
        type: data.isIncome ? 'income' : 'expense',
      };
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<void> {
  try {
    const db = getDb();
    const deviceId = await getDeviceId();
    const transactionId = await getNextTransactionId();
    
    const transactionData = {
      id: transactionId,
      amount: transaction.amount,
      type: transaction.category, // Using category as type for compatibility
      category: transaction.category,
      description: transaction.description,
      isIncome: transaction.type === 'income',
      date: new Date(transaction.date),
      deviceId: deviceId,
      relatedRegistrationId: null
    };
    
    await setDoc(doc(db, 'transactions', transactionId.toString()), transactionData);
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  try {
    const db = getDb();
    const deviceId = await getDeviceId();
    
    const transactionData = {
      id: parseInt(transaction.id),
      amount: transaction.amount,
      type: transaction.category,
      category: transaction.category,
      description: transaction.description,
      isIncome: transaction.type === 'income',
      date: new Date(transaction.date),
      deviceId: deviceId,
      relatedRegistrationId: null
    };
    
    await setDoc(doc(db, 'transactions', transaction.id), transactionData);
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  try {
    const db = getDb();
    await deleteDoc(doc(db, 'transactions', transactionId));
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
}