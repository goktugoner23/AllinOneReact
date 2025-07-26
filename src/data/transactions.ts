import { getDb } from './firestore';
import { getDeviceId } from './deviceId';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { Transaction } from '../types/Transaction';

export async function fetchTransactions(): Promise<Transaction[]> {
  const db = getDb();
  const deviceId = await getDeviceId();
  const q = query(
    collection(db, 'transactions'),
    where('deviceId', '==', deviceId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: data.id?.toString() ?? doc.id,
      amount: data.amount ?? 0,
      description: data.description ?? '',
      category: data.category ?? '',
      date:
        data.date instanceof Timestamp
          ? data.date.toDate().toISOString()
          : data.date ?? '',
      type: data.isIncome ? 'income' : 'expense',
    };
  });
}
