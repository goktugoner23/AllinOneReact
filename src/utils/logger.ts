/**
 * Logging utility for the AllInOne React Native app
 * Following performance guidelines to remove console statements in production
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: string;
  data?: any;
}

class Logger {
  private static logs: LogEntry[] = [];
  private static readonly MAX_LOGS = 100;
  private static enabledInProduction = false;

  /**
   * Enable logging in production (for debugging purposes)
   */
  static enableProductionLogging(): void {
    this.enabledInProduction = true;
  }

  /**
   * Check if logging should be performed
   */
  private static shouldLog(): boolean {
    return __DEV__ || this.enabledInProduction;
  }

  /**
   * Log debug message
   */
  static debug(message: string, data?: any, context?: string): void {
    if (!this.shouldLog()) return;

    console.debug(`🔍 [DEBUG] ${message}`, data || "");
    this.addToHistory("debug", message, context, data);
  }

  /**
   * Log info message
   */
  static info(message: string, data?: any, context?: string): void {
    if (!this.shouldLog()) return;

    console.info(`ℹ️ [INFO] ${message}`, data || "");
    this.addToHistory("info", message, context, data);
  }

  /**
   * Log warning message
   */
  static warn(message: string, data?: any, context?: string): void {
    if (!this.shouldLog()) return;

    console.warn(`⚠️ [WARN] ${message}`, data || "");
    this.addToHistory("warn", message, context, data);
  }

  /**
   * Log error message
   */
  static error(message: string, error?: Error | any, context?: string): void {
    // Always log errors, even in production
    console.error(`❌ [ERROR] ${message}`, error || "");
    this.addToHistory("error", message, context, error);

    // In production, you might want to report to crash analytics
    if (!__DEV__) {
      this.reportErrorToAnalytics(message, error, context);
    }
  }

  /**
   * Log with custom level
   */
  static log(
    level: LogLevel,
    message: string,
    data?: any,
    context?: string,
  ): void {
    switch (level) {
      case "debug":
        this.debug(message, data, context);
        break;
      case "info":
        this.info(message, data, context);
        break;
      case "warn":
        this.warn(message, data, context);
        break;
      case "error":
        this.error(message, data, context);
        break;
    }
  }

  /**
   * Add log entry to history
   */
  private static addToHistory(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      data,
    };

    this.logs.push(entry);

    // Keep only the last MAX_LOGS entries
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }
  }

  /**
   * Report error to analytics service
   */
  private static reportErrorToAnalytics(
    message: string,
    error?: any,
    context?: string,
  ): void {
    try {
      // In production, report to your error tracking service
      // Example: Crashlytics.recordError(error);
      // Example: Sentry.captureException(error, { extra: { message, context } });

      // For now, we'll just store it locally
      this.addToHistory("error", `ANALYTICS: ${message}`, context, error);
    } catch (reportError) {
      // Fallback if analytics reporting fails
      console.error("Failed to report error to analytics:", reportError);
    }
  }

  /**
   * Get log history
   */
  static getHistory(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return [...this.logs];
  }

  /**
   * Clear log history
   */
  static clearHistory(): void {
    this.logs = [];
  }

  /**
   * Export logs for debugging
   */
  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Performance specific logging
   */
  static performance(
    message: string,
    duration: number,
    context?: string,
  ): void {
    if (!this.shouldLog()) return;

    const emoji = duration > 1000 ? "🐌" : duration > 100 ? "⚡" : "💨";
    console.log(`${emoji} [PERF] ${message}: ${duration.toFixed(2)}ms`);
    this.addToHistory("info", `PERF: ${message}`, context, { duration });
  }

  /**
   * Network request logging
   */
  static network(
    method: string,
    url: string,
    status?: number,
    duration?: number,
  ): void {
    if (!this.shouldLog()) return;

    const statusEmoji = status && status >= 400 ? "❌" : "✅";
    const durationText = duration ? ` (${duration.toFixed(2)}ms)` : "";
    console.log(`🌐 [NETWORK] ${method} ${url} ${status || ""}${durationText}`);
    this.addToHistory("info", `NETWORK: ${method} ${url}`, "network", {
      status,
      duration,
    });
  }

  /**
   * Firebase operation logging
   */
  static firebase(
    operation: string,
    collection: string,
    success: boolean,
    error?: any,
  ): void {
    if (!this.shouldLog()) return;

    const emoji = success ? "🔥✅" : "🔥❌";
    const message = `[FIREBASE] ${operation} on ${collection}`;

    if (success) {
      console.log(`${emoji} ${message}`);
      this.addToHistory("info", `FIREBASE: ${message}`, "firebase");
    } else {
      console.error(`${emoji} ${message}`, error);
      this.addToHistory("error", `FIREBASE: ${message}`, "firebase", error);
    }
  }
}

// Create convenient logging functions
export const logger = {
  debug: Logger.debug.bind(Logger),
  info: Logger.info.bind(Logger),
  warn: Logger.warn.bind(Logger),
  error: Logger.error.bind(Logger),
  performance: Logger.performance.bind(Logger),
  network: Logger.network.bind(Logger),
  firebase: Logger.firebase.bind(Logger),
  getHistory: Logger.getHistory.bind(Logger),
  clearHistory: Logger.clearHistory.bind(Logger),
  exportLogs: Logger.exportLogs.bind(Logger),
  enableProductionLogging: Logger.enableProductionLogging.bind(Logger),
};

// Custom hook for component-specific logging
export const useLogger = (componentName: string) => {
  return {
    debug: (message: string, data?: any) =>
      Logger.debug(message, data, componentName),
    info: (message: string, data?: any) =>
      Logger.info(message, data, componentName),
    warn: (message: string, data?: any) =>
      Logger.warn(message, data, componentName),
    error: (message: string, error?: any) =>
      Logger.error(message, error, componentName),
    performance: (message: string, duration: number) =>
      Logger.performance(message, duration, componentName),
  };
};

export default Logger;
