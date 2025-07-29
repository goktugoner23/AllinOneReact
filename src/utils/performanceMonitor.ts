/**
 * Performance monitoring utility
 * Following performance guidelines for tracking and optimization
 */

interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
  type: "async" | "sync";
  memoryUsage?: number;
  context?: string;
}

class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly MAX_METRICS = 100; // Keep only last 100 metrics

  /**
   * Measure async operations
   */
  static async measureAsyncOperation<T>(
    name: string,
    operation: () => Promise<T>,
    context?: string,
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      const endMemory = this.getMemoryUsage();

      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        type: "async",
        memoryUsage: endMemory - startMemory,
        context,
      });

      if (__DEV__) {
        console.log(`⚡ ${name} completed in ${duration.toFixed(2)}ms`);
        if (endMemory - startMemory > 0) {
          console.log(
            `💾 Memory delta: ${((endMemory - startMemory) / 1024 / 1024).toFixed(2)}MB`,
          );
        }
      }

      // Report to analytics in production
      if (!__DEV__ && this.shouldReportMetric(duration)) {
        this.reportToAnalytics(name, duration, context);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      if (__DEV__) {
        console.error(
          `❌ ${name} failed after ${duration.toFixed(2)}ms:`,
          error,
        );
      }

      this.recordMetric({
        name: `${name}_error`,
        duration,
        timestamp: Date.now(),
        type: "async",
        context: `Error: ${(error as Error).message}`,
      });

      throw error;
    }
  }

  /**
   * Measure synchronous operations
   */
  static measureSyncOperation<T>(
    name: string,
    operation: () => T,
    context?: string,
  ): T {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = operation();
      const duration = performance.now() - startTime;
      const endMemory = this.getMemoryUsage();

      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        type: "sync",
        memoryUsage: endMemory - startMemory,
        context,
      });

      if (__DEV__ && duration > 16) {
        // Warn if blocking for more than one frame
        console.warn(
          `🐌 ${name} blocked JS thread for ${duration.toFixed(2)}ms`,
        );
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      if (__DEV__) {
        console.error(
          `❌ ${name} failed after ${duration.toFixed(2)}ms:`,
          error,
        );
      }

      this.recordMetric({
        name: `${name}_error`,
        duration,
        timestamp: Date.now(),
        type: "sync",
        context: `Error: ${(error as Error).message}`,
      });

      throw error;
    }
  }

  /**
   * Start a manual timing measurement
   */
  static startTiming(name: string): () => void {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    return () => {
      const duration = performance.now() - startTime;
      const endMemory = this.getMemoryUsage();

      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        type: "async",
        memoryUsage: endMemory - startMemory,
      });

      if (__DEV__) {
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Get current memory usage
   */
  private static getMemoryUsage(): number {
    if (typeof performance !== "undefined" && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Record performance metric
   */
  private static recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only the last MAX_METRICS entries
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Check if metric should be reported to analytics
   */
  private static shouldReportMetric(duration: number): boolean {
    // Report slow operations (> 1 second) or random sampling
    return duration > 1000 || Math.random() < 0.01; // 1% sampling
  }

  /**
   * Report metric to analytics service
   */
  private static reportToAnalytics(
    name: string,
    duration: number,
    context?: string,
  ): void {
    // In a real app, you would send this to your analytics service
    // Example: Firebase Analytics, Crashlytics, etc.
    try {
      // Example implementation:
      // analytics.time(name, duration, { context });
      console.log("Analytics:", { name, duration, context });
    } catch (error) {
      console.error("Failed to report analytics:", error);
    }
  }

  /**
   * Get performance summary
   */
  static getPerformanceSummary(): {
    averageAsyncDuration: number;
    averageSyncDuration: number;
    slowestOperations: PerformanceMetrics[];
    totalMemoryUsage: number;
    operationCounts: Record<string, number>;
  } {
    const asyncMetrics = this.metrics.filter((m) => m.type === "async");
    const syncMetrics = this.metrics.filter((m) => m.type === "sync");

    const averageAsyncDuration =
      asyncMetrics.length > 0
        ? asyncMetrics.reduce((sum, m) => sum + m.duration, 0) /
          asyncMetrics.length
        : 0;

    const averageSyncDuration =
      syncMetrics.length > 0
        ? syncMetrics.reduce((sum, m) => sum + m.duration, 0) /
          syncMetrics.length
        : 0;

    const slowestOperations = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const totalMemoryUsage = this.metrics.reduce(
      (sum, m) => sum + (m.memoryUsage || 0),
      0,
    );

    const operationCounts = this.metrics.reduce(
      (counts, m) => {
        counts[m.name] = (counts[m.name] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>,
    );

    return {
      averageAsyncDuration,
      averageSyncDuration,
      slowestOperations,
      totalMemoryUsage,
      operationCounts,
    };
  }

  /**
   * Clear all metrics
   */
  static clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Log performance summary to console
   */
  static logSummary(): void {
    if (!__DEV__) return;

    const summary = this.getPerformanceSummary();

    console.group("📊 Performance Summary");
    console.log(
      `Average Async Duration: ${summary.averageAsyncDuration.toFixed(2)}ms`,
    );
    console.log(
      `Average Sync Duration: ${summary.averageSyncDuration.toFixed(2)}ms`,
    );
    console.log(
      `Total Memory Usage: ${(summary.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB`,
    );
    console.log("Operation Counts:", summary.operationCounts);
    console.log("Slowest Operations:", summary.slowestOperations.slice(0, 5));
    console.groupEnd();
  }
}

// Custom hook for component performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const measureRender = (renderName?: string) => {
    return PerformanceMonitor.startTiming(
      `${componentName}_${renderName || "render"}`,
    );
  };

  const measureAsyncAction = async <T>(
    actionName: string,
    action: () => Promise<T>,
  ): Promise<T> => {
    return PerformanceMonitor.measureAsyncOperation(
      `${componentName}_${actionName}`,
      action,
      componentName,
    );
  };

  return {
    measureRender,
    measureAsyncAction,
  };
};

// Export the performance monitor
export { PerformanceMonitor };
