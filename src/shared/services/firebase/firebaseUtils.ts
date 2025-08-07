import { FirebaseError } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  Query,
  DocumentData,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Result type pattern for better error handling
 * Following TypeScript guidelines for error handling
 */
export type Result<T, E = FirebaseError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Firebase error handler
 * Converts Firebase errors to user-friendly messages
 */
export const handleFirebaseError = (error: FirebaseError): string => {
  switch (error.code) {
    case "permission-denied":
      return "You do not have permission to perform this action.";
    case "unavailable":
      return "Service is currently unavailable. Please try again later.";
    case "deadline-exceeded":
      return "Request took too long. Please check your connection.";
    case "unauthenticated":
      return "You need to be signed in to perform this action.";
    case "resource-exhausted":
      return "Too many requests. Please wait a moment and try again.";
    case "not-found":
      return "The requested data was not found.";
    case "already-exists":
      return "This item already exists.";
    case "invalid-argument":
      return "Invalid data provided. Please check your input.";
    default:
      return error.message || "An unexpected error occurred.";
  }
};

/**
 * Generic Firebase document operations with error handling
 */
export class FirebaseRepository<T extends { id: string | number }> {
  constructor(private collectionName: string) {}

  /**
   * Fetch all documents with optional filtering and pagination
   */
  async getAll(
    filters?: Array<{ field: string; operator: any; value: any }>,
    orderByField?: string,
    orderDirection: "asc" | "desc" = "desc",
    limitCount?: number,
    lastDoc?: DocumentSnapshot,
  ): Promise<Result<T[]>> {
    try {
      let q: Query<DocumentData> = collection(db, this.collectionName);

      // Apply filters
      if (filters && filters.length > 0) {
        filters.forEach((filter) => {
          q = query(q, where(filter.field, filter.operator, filter.value));
        });
      }

      // Apply ordering
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection));
      }

      // Apply pagination
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      return { success: true, data };
    } catch (error) {
      console.error(`Error fetching ${this.collectionName}:`, error);
      return {
        success: false,
        error: error as FirebaseError,
      };
    }
  }

  /**
   * Get a single document by ID
   */
  async getById(id: string): Promise<Result<T | null>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          ...docSnap.data(),
        } as T;
        return { success: true, data };
      } else {
        return { success: true, data: null };
      }
    } catch (error) {
      console.error(`Error fetching ${this.collectionName} by ID:`, error);
      return {
        success: false,
        error: error as FirebaseError,
      };
    }
  }

  /**
   * Create or update a document
   */
  async save(data: Omit<T, "id">, id?: string): Promise<Result<T>> {
    try {
      const docId = id || Date.now().toString();
      const docRef = doc(db, this.collectionName, docId);

      const documentData = {
        ...data,
        updatedAt: new Date(),
        createdAt: id ? undefined : new Date(), // Only set createdAt for new documents
      };

      await setDoc(docRef, documentData, { merge: !!id });

      const savedData = {
        id: docId,
        ...documentData,
      } as unknown as T;

      return { success: true, data: savedData };
    } catch (error) {
      console.error(`Error saving ${this.collectionName}:`, error);
      return {
        success: false,
        error: error as FirebaseError,
      };
    }
  }

  /**
   * Delete a document by ID
   */
  async delete(id: string): Promise<Result<void>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      return { success: true, data: undefined };
    } catch (error) {
      console.error(`Error deleting ${this.collectionName}:`, error);
      return {
        success: false,
        error: error as FirebaseError,
      };
    }
  }
}

/**
 * Batch operations for better performance
 */
export const performBatchOperation = async <T>(
  operations: Array<() => Promise<T>>,
  batchSize: number = 10,
): Promise<Result<T[]>> => {
  try {
    const results: T[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((op) => op()));
      results.push(...batchResults);
    }

    return { success: true, data: results };
  } catch (error) {
    console.error("Error performing batch operation:", error);
    return {
      success: false,
      error: error as FirebaseError,
    };
  }
};

/**
 * Cache manager for offline capabilities
 */
export class CacheManager {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  static clear(): void {
    this.cache.clear();
  }

  static clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Network status aware Firebase operations
 */
export const withNetworkAwareness = async <T>(
  operation: () => Promise<Result<T>>,
  cacheKey?: string,
): Promise<Result<T>> => {
  // Try to get cached data first if offline
  if (cacheKey) {
    const cachedData = CacheManager.get<T>(cacheKey);
    if (cachedData) {
      console.log("Returning cached data for:", cacheKey);
      return { success: true, data: cachedData };
    }
  }

  // Perform the operation
  const result = await operation();

  // Cache successful results
  if (result.success && cacheKey) {
    CacheManager.set(cacheKey, result.data);
  }

  return result;
};
