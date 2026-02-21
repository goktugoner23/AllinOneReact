import { logger } from '@shared/utils/logger';

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success?: boolean;
  error?: string;
}

const metrics = new Map<string, PerformanceMetric>();
const isEnabled = __DEV__;

function startTimer(operation: string) {
  if (!isEnabled) return;
  metrics.set(operation, { operation, startTime: performance.now() });
}

function endTimer(operation: string, success = true, error?: string) {
  if (!isEnabled) return;
  const metric = metrics.get(operation);
  if (!metric) return;

  metric.endTime = performance.now();
  metric.duration = metric.endTime - metric.startTime;
  metric.success = success;
  metric.error = error;

  logger.debug(`Performance: ${operation} completed in ${metric.duration.toFixed(2)}ms`);
  if (metric.duration > 1000) {
    logger.warn(`Performance: Slow operation - ${operation} took ${metric.duration.toFixed(2)}ms`);
  }
}

function getMetrics(): PerformanceMetric[] {
  return Array.from(metrics.values());
}

function clearMetrics() {
  metrics.clear();
}

export default { startTimer, endTimer, getMetrics, clearMetrics };
