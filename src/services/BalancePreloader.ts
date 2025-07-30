import { store } from '../store';
import { loadCachedBalance, calculateBalance } from '../store/balanceSlice';
import { logger } from '../utils/logger';

class BalancePreloader {
  private static instance: BalancePreloader;
  private isPreloading = false;
  private preloadPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): BalancePreloader {
    if (!BalancePreloader.instance) {
      BalancePreloader.instance = new BalancePreloader();
    }
    return BalancePreloader.instance;
  }

  /**
   * Preload balance data in the background
   * This should be called when the app starts
   */
  async preloadBalance(): Promise<void> {
    if (this.isPreloading) {
      // If already preloading, return the existing promise
      return this.preloadPromise!;
    }

    this.isPreloading = true;
    this.preloadPromise = this.performPreload();

    try {
      await this.preloadPromise;
    } finally {
      this.isPreloading = false;
      this.preloadPromise = null;
    }
  }

  private async performPreload(): Promise<void> {
    try {
      logger.debug('Starting balance preload', {}, 'BalancePreloader');

      // First, try to load from cache (fast)
      const cachedResult = await store.dispatch(loadCachedBalance());
      
      if (cachedResult.payload && !cachedResult.payload.isStale) {
        logger.debug('Balance loaded from cache', {
          lastUpdated: cachedResult.payload.lastUpdated,
        }, 'BalancePreloader');
        return;
      }

      // If no cache or cache is stale, calculate fresh balance in background
      logger.debug('Cache miss or stale, calculating fresh balance', {}, 'BalancePreloader');
      await store.dispatch(calculateBalance());
      
      logger.debug('Balance preload completed', {}, 'BalancePreloader');
    } catch (error) {
      logger.error('Error during balance preload', error, 'BalancePreloader');
    }
  }

  /**
   * Check if balance is currently being preloaded
   */
  isPreloadingBalance(): boolean {
    return this.isPreloading;
  }

  /**
   * Get the current preload promise if one exists
   */
  getPreloadPromise(): Promise<void> | null {
    return this.preloadPromise;
  }
}

export default BalancePreloader; 