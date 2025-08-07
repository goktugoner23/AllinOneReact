import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage wrapper with error handling and type safety
 */
export class StorageService {
  /**
   * Store a value in AsyncStorage
   */
  static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Failed to store item with key "${key}":`, error);
      throw new Error(`Storage error: Failed to store ${key}`);
    }
  }

  /**
   * Retrieve a value from AsyncStorage
   */
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Failed to retrieve item with key "${key}":`, error);
      return null;
    }
  }

  /**
   * Remove a value from AsyncStorage
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item with key "${key}":`, error);
      throw new Error(`Storage error: Failed to remove ${key}`);
    }
  }

  /**
   * Clear all AsyncStorage data
   */
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear AsyncStorage:', error);
      throw new Error('Storage error: Failed to clear storage');
    }
  }

  /**
   * Get all keys from AsyncStorage
   */
  static async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys]; // Create a mutable copy
    } catch (error) {
      console.error('Failed to get all keys from AsyncStorage:', error);
      return [];
    }
  }

  /**
   * Check if a key exists in AsyncStorage
   */
  static async hasItem(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`Failed to check if key "${key}" exists:`, error);
      return false;
    }
  }

  /**
   * Store multiple items at once
   */
  static async multiSet(keyValuePairs: Array<[string, any]>): Promise<void> {
    try {
      const jsonPairs: Array<[string, string]> = keyValuePairs.map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(jsonPairs);
    } catch (error) {
      console.error('Failed to store multiple items:', error);
      throw new Error('Storage error: Failed to store multiple items');
    }
  }

  /**
   * Retrieve multiple items at once
   */
  static async multiGet<T>(keys: string[]): Promise<Array<[string, T | null]>> {
    try {
      const results = await AsyncStorage.multiGet(keys);
      return results.map(([key, value]) => [
        key,
        value ? JSON.parse(value) : null,
      ]);
    } catch (error) {
      console.error('Failed to retrieve multiple items:', error);
      return keys.map(key => [key, null]);
    }
  }
}

// Storage keys constants
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  THEME_MODE: 'theme_mode',
  LAST_SYNC: 'last_sync',
  CACHED_DATA: 'cached_data',
  APP_VERSION: 'app_version',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];