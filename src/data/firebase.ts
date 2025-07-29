import { db } from '../config/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Get Firestore database instance
export const getDb = () => db;

// Get device ID for data isolation - matches Kotlin app format
export const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem('device_id');
    if (!deviceId) {
      // Match Kotlin app format: "device_${System.currentTimeMillis()}_${Math.abs(android.os.Build.MODEL.hashCode())}"
      const timestamp = Date.now();
      const deviceModel = Platform.OS === 'android' ? 'android' : 'ios';
      // Simple hash function to match Kotlin's hashCode behavior
      const modelHash = Math.abs(deviceModel.split('').reduce((hash, char) => {
        return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
      }, 0));
      deviceId = `device_${timestamp}_${modelHash}`;
      await AsyncStorage.setItem('device_id', deviceId);
      console.log('Generated new device ID:', deviceId);
    } else {
      console.log('Using existing device ID:', deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback device ID matching Kotlin format
    const timestamp = Date.now();
    return `device_${timestamp}`;
  }
};

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
    ...data
  };
}; 