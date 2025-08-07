import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage as getFirebaseStorage } from 'firebase/storage';

// Your Firebase configuration (Web)
const firebaseConfig = {
  apiKey: "AIzaSyBmOB-8mLk44CwtnlbXu5-piR-nihSgKqc",
  authDomain: "allinone-bd6f3.firebaseapp.com",
  projectId: "allinone-bd6f3",
  storageBucket: "allinone-bd6f3.firebasestorage.app",
  messagingSenderId: "954911141967",
  appId: "1:954911141967:android:8369e5e490f1dab9ce7a3a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with RN-friendly transport
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  experimentalLongPollingOptions: { timeoutSeconds: 30 },
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
