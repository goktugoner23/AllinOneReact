import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { getDb } from './firebase';

/**
 * Manages sequential ID generation for Firebase Firestore documents.
 * This class handles retrieving and incrementing ID counters stored in the "counters" collection.
 */
export class FirebaseIdManager {
  private db = getDb();
  private countersCollection = 'counters';

  /**
   * Gets the next sequential ID for a specific collection.
   * IDs start from 0 and increment sequentially.
   *
   * @param collectionName The name of the collection to get the next ID for
   * @returns The next available ID as number
   */
  async getNextId(collectionName: string): Promise<number> {
    try {
      // Use a standardized collection name for workout-related items
      const standardizedCollectionName = this.getStandardizedCollectionName(collectionName);
      console.log('FirebaseIdManager: Getting next ID for', collectionName, '->', standardizedCollectionName);
      
      // Check if document exists
      const docRef = doc(this.db, this.countersCollection, standardizedCollectionName);
      const docSnap = await getDoc(docRef);

      // If document doesn't exist, create it with initial count of 1
      if (!docSnap.exists() || !docSnap.data()?.count) {
        const initialData = { count: 1 };
        await setDoc(docRef, initialData);
        console.log('FirebaseIdManager: Created new counter for', standardizedCollectionName, 'with ID 1');
        return 1;
      }

      // Get the current count and atomically increment it
      await updateDoc(docRef, {
        count: increment(1)
      });
      
      // Retrieve the updated count
      const updatedDocSnap = await getDoc(docRef);
      const newCount = updatedDocSnap.data()?.count || 1;
      
      console.log('FirebaseIdManager: Generated ID', newCount, 'for', standardizedCollectionName);
      return newCount;
    } catch (error) {
      // Log failure and handle gracefully
      console.error('FirebaseIdManager: Failed to get next ID:', error);
      
      // In case of failure, generate a timestamp-based ID as fallback
      const fallbackId = Date.now();
      console.log('FirebaseIdManager: Using fallback ID:', fallbackId);
      return fallbackId;
    }
  }

  /**
   * Gets the last used ID for a specific collection without incrementing it.
   * This is useful for retrieving the current counter value without changing it.
   *
   * @param collectionName The name of the collection to get the last ID for
   * @returns The last used ID as number
   */
  async getLastId(collectionName: string): Promise<number> {
    try {
      // Get the current counter value without incrementing
      const docRef = doc(this.db, this.countersCollection, collectionName);
      const docSnap = await getDoc(docRef);
      const count = docSnap.data()?.count;

      return count || 0;
    } catch (error) {
      // If the counter doesn't exist, create it starting at 0
      if (error instanceof Error && error.message.includes('NOT_FOUND')) {
        try {
          // Create the counter document with initial value 0
          const initialData = { count: 0 };
          const docRef = doc(this.db, this.countersCollection, collectionName);
          await setDoc(docRef, initialData);
          return 0; // Return 0 as the first ID
        } catch (createError) {
          console.error('FirebaseIdManager: Error creating counter for', collectionName, createError);
          return 0;
        }
      } else {
        console.error('FirebaseIdManager: Error getting last ID for', collectionName, error);
        return 0;
      }
    }
  }

  /**
   * Standardizes collection names for workout-related items to match the Kotlin implementation.
   */
  private getStandardizedCollectionName(collectionName: string): string {
    switch (collectionName) {
      case 'programs':
        return 'workouts_programs';
      case 'workouts':
        return 'workouts_sessions';
      case 'exercises':
        return 'workouts_exercises';
      case 'tasks':
        return 'tasks';
      case 'taskGroups':
        return 'taskGroups';
      default:
        return collectionName;
    }
  }
}

// Export a singleton instance
export const firebaseIdManager = new FirebaseIdManager(); 