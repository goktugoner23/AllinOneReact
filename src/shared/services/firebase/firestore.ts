import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  enableNetwork, 
  disableNetwork,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

// Firebase config from google-services.json (Kotlin app)
const firebaseConfig = {
  apiKey: 'AIzaSyCXF4JpOl3_FXEzODDslf9VeTs9BGOiO1s',
  authDomain: 'allinone-bd6f3.firebaseapp.com',
  projectId: 'allinone-bd6f3',
  storageBucket: 'allinone-bd6f3.firebasestorage.app',
  messagingSenderId: '954911141967',
  appId: '1:954911141967:android:8369e5e490f1dab9ce7a3a',
};

let app: FirebaseApp;
let db: Firestore;

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return app;
}

export function getDb(): Firestore {
  if (!db) {
    const app = getFirebaseApp();
    
    try {
      // Initialize Firestore with offline persistence
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (error) {
      // Fallback to regular getFirestore if initialization fails
      console.warn('Failed to initialize Firestore with persistence, using default:', error);
      db = getFirestore(app);
    }
  }
  return db;
}

export async function enableFirestoreNetwork(): Promise<void> {
  try {
    await enableNetwork(getDb());
  } catch (error) {
    console.error('Failed to enable Firestore network:', error);
  }
}

export async function disableFirestoreNetwork(): Promise<void> {
  try {
    await disableNetwork(getDb());
  } catch (error) {
    console.error('Failed to disable Firestore network:', error);
  }
}
