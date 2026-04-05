type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: string;
  data?: any;
}

const logs: LogEntry[] = [];
const MAX_LOGS = 100;

const shouldLog = () => __DEV__;

const addToHistory = (level: LogLevel, message: string, context?: string, data?: any) => {
  logs.push({ level, message, timestamp: Date.now(), context, data });
  if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
};

export const logger = {
  debug(message: string, data?: any, context?: string) {
    if (!shouldLog()) return;
    console.debug(`🔍 [DEBUG] ${message}`, data || '');
    addToHistory('debug', message, context, data);
  },

  info(message: string, data?: any, context?: string) {
    if (!shouldLog()) return;
    console.info(`ℹ️ [INFO] ${message}`, data || '');
    addToHistory('info', message, context, data);
  },

  warn(message: string, data?: any, context?: string) {
    if (!shouldLog()) return;
    console.warn(`⚠️ [WARN] ${message}`, data || '');
    addToHistory('warn', message, context, data);
  },

  error(message: string, error?: Error | any, context?: string) {
    console.error(`❌ [ERROR] ${message}`, error || '');
    addToHistory('error', message, context, error);
  },

  performance(message: string, duration: number, context?: string) {
    if (!shouldLog()) return;
    const emoji = duration > 1000 ? '🐌' : duration > 100 ? '⚡' : '💨';
    console.log(`${emoji} [PERF] ${message}: ${duration.toFixed(2)}ms`);
    addToHistory('info', `PERF: ${message}`, context, { duration });
  },

  network(method: string, url: string, status?: number, duration?: number) {
    if (!shouldLog()) return;
    const statusEmoji = status && status >= 400 ? '❌' : '✅';
    const durationText = duration ? ` (${duration.toFixed(2)}ms)` : '';
    console.log(`🌐 [NETWORK] ${method} ${url} ${status || ''}${durationText}`);
    addToHistory('info', `NETWORK: ${method} ${url}`, 'network', { status, duration });
  },

  data(operation: string, resource: string, success: boolean, error?: any) {
    if (!shouldLog()) return;
    const emoji = success ? '📦✅' : '📦❌';
    const message = `[DATA] ${operation} on ${resource}`;
    if (success) {
      console.log(`${emoji} ${message}`);
      addToHistory('info', `DATA: ${message}`, 'data');
    } else {
      console.error(`${emoji} ${message}`, error);
      addToHistory('error', `DATA: ${message}`, 'data', error);
    }
  },

  getHistory(level?: LogLevel): LogEntry[] {
    return level ? logs.filter((log) => log.level === level) : [...logs];
  },

  clearHistory() {
    logs.length = 0;
  },

  exportLogs(): string {
    return JSON.stringify(logs, null, 2);
  },
};

export default logger;
