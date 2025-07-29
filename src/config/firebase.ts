import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration based on google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyBmOB-8mLk44CwtnlbXu5-piR-nihSgKqc",
  authDomain: "allinone-bd6f3.firebaseapp.com",
  projectId: "allinone-bd6f3",
  storageBucket: "allinone-bd6f3.firebasestorage.app",
  messagingSenderId: "954911141967",
  appId: "1:954911141967:android:8369e5e490f1dab9ce7a3a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services (no auth needed for personal app)
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app; 