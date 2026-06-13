type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const shouldLog = () => __DEV__;

// Thin console wrapper. (A previous in-memory log-history buffer +
// getHistory/exportLogs/clearHistory were removed — nothing ever read them.)
export const logger = {
  debug(message: string, data?: any, _context?: string) {
    if (!shouldLog()) return;
    console.debug(`🔍 [DEBUG] ${message}`, data || '');
  },

  info(message: string, data?: any, _context?: string) {
    if (!shouldLog()) return;
    console.info(`ℹ️ [INFO] ${message}`, data || '');
  },

  warn(message: string, data?: any, _context?: string) {
    if (!shouldLog()) return;
    console.warn(`⚠️ [WARN] ${message}`, data || '');
  },

  error(message: string, error?: Error | any, _context?: string) {
    console.error(`❌ [ERROR] ${message}`, error || '');
  },

  performance(message: string, duration: number, _context?: string) {
    if (!shouldLog()) return;
    const emoji = duration > 1000 ? '🐌' : duration > 100 ? '⚡' : '💨';
    console.log(`${emoji} [PERF] ${message}: ${duration.toFixed(2)}ms`);
  },

  network(method: string, url: string, status?: number, duration?: number) {
    if (!shouldLog()) return;
    const durationText = duration ? ` (${duration.toFixed(2)}ms)` : '';
    console.log(`🌐 [NETWORK] ${method} ${url} ${status || ''}${durationText}`);
  },

  data(operation: string, resource: string, success: boolean, error?: any) {
    if (!shouldLog()) return;
    const emoji = success ? '📦✅' : '📦❌';
    const message = `[DATA] ${operation} on ${resource}`;
    if (success) {
      console.log(`${emoji} ${message}`);
    } else {
      console.error(`${emoji} ${message}`, error);
    }
  },
};

export default logger;
