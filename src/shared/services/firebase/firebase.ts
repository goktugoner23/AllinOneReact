import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage as getFirebaseStorage } from 'firebase/storage';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from '@env';

// Your Firebase configuration (loaded from env)
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with RN-friendly transport
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  experimentalLongPollingOptions: { timeoutSeconds: 30 },
  ignoreUndefinedProperties: true,
});
const storage = getFirebaseStorage(app);
import {
  Timestamp,
} from "firebase/firestore";

// Get Firestore database instance
export const getDb = () => db;

// Get Firebase Storage instance
export const getStorageInstance = () => storage;



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
