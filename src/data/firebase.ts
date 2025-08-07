import { db, storage } from "../config/firebase";
import {
  Timestamp,
} from "firebase/firestore";
import { logger } from "../utils/logger";

// Get Firestore database instance
export const getDb = () => db;

// Get Firebase Storage instance
export const getStorage = () => storage;



// Helper function to convert Date to Firestore Timestamp
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Helper function to convert Firestore Timestamp to Date
export const timestampToDate = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  } else if (timestamp?.toDate) {
    return timestamp.toDate();
  } else if (timestamp instanceof Date) {
    return timestamp;
  } else {
    return new Date(timestamp);
  }
};

// Helper function to safely get document data
export const getDocData = (doc: any) => {
  const data = doc.data();
  return {
    id: data?.id || parseInt(doc.id),
    ...data,
  };
};
