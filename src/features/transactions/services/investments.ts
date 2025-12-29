import { collection, doc, getDocs, setDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getDb } from '@shared/services/firebase/firebase';
import { firebaseIdManager } from '@shared/services/firebase/firebaseIdManager';
import { Investment } from '../types/Investment';
import { MediaAttachment } from '@shared/types/MediaAttachment';
import { uploadInvestmentAttachments } from './investmentAttachments';

let nextInvestmentId = 1;

// Get next sequential ID for investments
async function getNextInvestmentId(): Promise<number> {
  const db = getDb();

  try {
    const q = query(collection(db, 'investments'), orderBy('id', 'desc'));
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

// Cache for investment counts
let investmentCache: {
  count: number;
  investments: Investment[];
  timestamp: number;
} | null = null;
const INVESTMENT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchInvestments(limit: number = 100): Promise<Investment[]> {
  try {
    const now = Date.now();

    // Check if we have a valid cache
    if (investmentCache && now - investmentCache.timestamp < INVESTMENT_CACHE_DURATION) {
      // Return limited results from cache
      return investmentCache.investments.slice(0, limit);
    }

    const db = getDb();

    // Get all investments (not filtered by deviceId like in Kotlin app)
    // Simple query without ordering to avoid index requirements
    const q = query(collection(db, 'investments'));

    const snapshot = await getDocs(q);

    // Sort in memory instead of in the query
    const investments = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id?.toString() ?? doc.id,
        name: data.name ?? '',
        amount: data.amount ?? 0,
        type: data.type ?? '',
        description: data.description ?? '',
        imageUri: data.imageUri ?? '',
        imageUris: data.imageUris ?? '',
        videoUris: data.videoUris ?? '',
        voiceNoteUris: data.voiceNoteUris ?? '',
        date:
          data.date instanceof Timestamp
            ? data.date.toDate().toISOString()
            : data.date?.toDate?.()
              ? data.date.toDate().toISOString()
              : new Date().toISOString(),
        isPast: data.isPast ?? false,
        profitLoss: data.profitLoss ?? 0,
        currentValue: data.currentValue ?? data.amount ?? 0,
      };
    });

    // Sort by date descending in memory
    const sortedInvestments = investments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Update cache
    investmentCache = {
      count: sortedInvestments.length,
      investments: sortedInvestments,
      timestamp: now,
    };

    // Return limited results
    return sortedInvestments.slice(0, limit);
  } catch (error) {
    console.error('Error fetching investments:', error);
    return [];
  }
}

export async function getInvestmentCount(): Promise<number> {
  try {
    const now = Date.now();

    // Check if we have a valid cache
    if (investmentCache && now - investmentCache.timestamp < INVESTMENT_CACHE_DURATION) {
      return investmentCache.count;
    }

    // If no cache, fetch investments to get count
    const investments = await fetchInvestments(1000); // Fetch more to ensure we get all

    // Cache should be updated by fetchInvestments
    return investmentCache?.count || investments.length;
  } catch (error) {
    console.error('Error getting investment count:', error);
    return 0;
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
      imageUris: investment.imageUris || '',
      videoUris: investment.videoUris || '',
      voiceNoteUris: investment.voiceNoteUris || '',
      date: investment.date,
      isPast: investment.isPast,
      profitLoss: investment.profitLoss,
      currentValue: investment.currentValue,
    };

    await setDoc(doc(db, 'investments', investmentId.toString()), investmentData);

    // Clear investment cache
    investmentCache = null;
  } catch (error) {
    console.error('Error adding investment:', error);
    throw error;
  }
}

/**
 * Create a new investment with attachments uploaded under investments/{id}/...
 */
export async function addInvestmentWithAttachments(
  investment: Omit<Investment, 'id' | 'imageUris' | 'videoUris' | 'voiceNoteUris'>,
  attachments: MediaAttachment[],
): Promise<void> {
  try {
    const db = getDb();
    const investmentId = await firebaseIdManager.getNextId('investments');

    // Upload attachments under investments/{investmentId}
    const uploaded = await uploadInvestmentAttachments(investmentId.toString(), attachments);

    const investmentData = {
      id: investmentId,
      name: investment.name,
      amount: investment.amount,
      type: investment.type,
      description: investment.description || '',
      imageUri: uploaded.imageUris[0] || investment.imageUri || '',
      imageUris: uploaded.imageUris.join(','),
      videoUris: uploaded.videoUris.join(','),
      voiceNoteUris: uploaded.voiceNoteUris.join(','),
      date: investment.date,
      isPast: investment.isPast,
      profitLoss: investment.profitLoss,
      currentValue: investment.currentValue,
    };

    await setDoc(doc(db, 'investments', investmentId.toString()), investmentData);

    // Clear cache
    investmentCache = null;
  } catch (error) {
    console.error('Error adding investment with attachments:', error);
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
      imageUris: investment.imageUris || '',
      videoUris: investment.videoUris || '',
      voiceNoteUris: investment.voiceNoteUris || '',
      isPast: investment.isPast || false,
      profitLoss: investment.profitLoss || 0,
      currentValue: investment.currentValue || investment.amount,
    };

    await setDoc(doc(db, 'investments', investment.id), investmentData);

    // Clear investment cache
    investmentCache = null;
  } catch (error) {
    console.error('Error updating investment:', error);
    throw error;
  }
}

export async function deleteInvestment(id: string): Promise<void> {
  try {
    const db = getDb();
    const ref = doc(db, 'investments', id);
    await deleteDoc(ref);

    // Clear investment cache
    investmentCache = null;
  } catch (error) {
    console.error('Error deleting investment:', error);
    throw error;
  }
}
