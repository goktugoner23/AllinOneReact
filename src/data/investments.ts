import { getDb } from './firestore';
import { getDeviceId } from './deviceId';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore';
import { Investment } from '../types/Investment';

export async function fetchInvestments(): Promise<Investment[]> {
  const db = getDb();
  const deviceId = await getDeviceId();
  const q = query(
    collection(db, 'investments'),
    where('deviceId', '==', deviceId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: data.id?.toString() ?? doc.id,
      name: data.name ?? '',
      amount: data.amount ?? 0,
      type: data.type ?? '',
      description: data.description ?? '',
      imageUri: data.imageUri ?? '',
      date:
        data.date instanceof Timestamp
          ? data.date.toDate().toISOString()
          : data.date ?? '',
      isPast: data.isPast ?? false,
      profitLoss: data.profitLoss ?? 0,
      currentValue: data.currentValue ?? 0,
    };
  });
}

export async function addInvestment(
  investment: Omit<Investment, 'id'>,
): Promise<void> {
  const db = getDb();
  const deviceId = await getDeviceId();
  await addDoc(collection(db, 'investments'), {
    ...investment,
    deviceId,
    date: new Date(investment.date),
  });
}

export async function updateInvestment(investment: Investment): Promise<void> {
  const db = getDb();
  const ref = doc(db, 'investments', investment.id);
  await updateDoc(ref, {
    ...investment,
    date: new Date(investment.date),
  });
}

export async function deleteInvestment(id: string): Promise<void> {
  const db = getDb();
  const ref = doc(db, 'investments', id);
  await deleteDoc(ref);
}
