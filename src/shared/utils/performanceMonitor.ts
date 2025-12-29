import { logger } from '@shared/utils/logger';

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success?: boolean;
  error?: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled = __DEV__; // Only enable in development

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTimer(operation: string): void {
    if (!this.isEnabled) return;

    this.metrics.set(operation, {
      operation,
      startTime: performance.now(),
    });

    logger.debug(`Performance: Started timing ${operation}`, {}, 'PerformanceMonitor');
  }

  /**
   * End timing an operation
   */
  endTimer(operation: string, success: boolean = true, error?: string): void {
    if (!this.isEnabled) return;

    const metric = this.metrics.get(operation);
    if (!metric) {
      logger.warn(`Performance: No timer found for operation ${operation}`, {}, 'PerformanceMonitor');
      return;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.success = success;
    metric.error = error;

    logger.debug(
      `Performance: ${operation} completed in ${metric.duration.toFixed(2)}ms`,
      {
        duration: metric.duration,
        success,
        error,
      },
      'PerformanceMonitor',
    );

    // Log warning for slow operations
    if (metric.duration > 1000) {
      logger.warn(
        `Performance: Slow operation detected - ${operation} took ${metric.duration.toFixed(2)}ms`,
        {
          duration: metric.duration,
        },
        'PerformanceMonitor',
      );
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(operation: string): number {
    const metrics = this.getMetrics().filter((m) => m.operation === operation && m.duration);
    if (metrics.length === 0) return 0;

    const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return totalDuration / metrics.length;
  }

  /**
   * Enable/disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

export default PerformanceMonitor;
