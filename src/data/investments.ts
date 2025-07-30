import { collection, doc, getDocs, setDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getDb } from './firebase';
import { firebaseIdManager } from './firebaseIdManager';
import { Investment } from '../types/Investment';

let nextInvestmentId = 1;

// Get next sequential ID for investments
async function getNextInvestmentId(): Promise<number> {
  const db = getDb();

  try {
    const q = query(
      collection(db, 'investments'),
      orderBy('id', 'desc')
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0];
      const lastId = lastDoc.data().id || 0;
      nextInvestmentId = lastId + 1;
    }
  } catch (error) {
    console.warn('Failed to get last investment ID, using fallback:', error);
  }

  return nextInvestmentId++;
}

export async function fetchInvestments(): Promise<Investment[]> {
  try {
    const db = getDb();

    // Get all investments (not filtered by deviceId like in Kotlin app)
    // Simple query without ordering to avoid index requirements
    const q = query(collection(db, 'investments'));

    const snapshot = await getDocs(q);

    // Sort in memory instead of in the query
    const investments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id?.toString() ?? doc.id,
        name: data.name ?? '',
        amount: data.amount ?? 0,
        type: data.type ?? '',
        description: data.description ?? '',
        imageUri: data.imageUri ?? '',
        date: data.date instanceof Timestamp
          ? data.date.toDate().toISOString()
          : (data.date?.toDate?.() ? data.date.toDate().toISOString() : new Date().toISOString()),
        isPast: data.isPast ?? false,
        profitLoss: data.profitLoss ?? 0,
        currentValue: data.currentValue ?? data.amount ?? 0,
      };
    });
    
    // Sort by date descending in memory
    return investments.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('Error fetching investments:', error);
    return [];
  }
}

export async function addInvestment(investment: Omit<Investment, 'id'>): Promise<void> {
  try {
    const db = getDb();
    const investmentId = await firebaseIdManager.getNextId('investments');
    
    const investmentData = {
      id: investmentId,
      name: investment.name,
      amount: investment.amount,
      type: investment.type,
      description: investment.description || '',
      imageUri: investment.imageUri || '',
      date: investment.date,
      isPast: investment.isPast,
      profitLoss: investment.profitLoss,
      currentValue: investment.currentValue,
    };
    
    await setDoc(doc(db, 'investments', investmentId.toString()), investmentData);
  } catch (error) {
    console.error('Error adding investment:', error);
    throw error;
  }
}

export async function updateInvestment(investment: Investment): Promise<void> {
  try {
    const db = getDb();

    const investmentData = {
      id: parseInt(investment.id),
      name: investment.name,
      type: investment.type,
      amount: investment.amount,
      description: investment.description || '',
      date: new Date(investment.date),
      imageUri: investment.imageUri || '',
      isPast: investment.isPast || false,
      profitLoss: investment.profitLoss || 0,
      currentValue: investment.currentValue || investment.amount,
    };

    await setDoc(doc(db, 'investments', investment.id), investmentData);
  } catch (error) {
    console.error('Error updating investment:', error);
    throw error;
  }
}

export async function deleteInvestment(id: string): Promise<void> {
  const db = getDb();
  const ref = doc(db, 'investments', id);
  await deleteDoc(ref);
}
