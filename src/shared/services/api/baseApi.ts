import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

/**
 * Base API client configuration for shared functionality
 */
export class BaseApiClient {
  protected api: AxiosInstance;
  protected readonly baseURL: string;

  constructor(baseURL: string, timeout: number = 30000) {
    this.baseURL = baseURL;

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        // Light-weight logging only in dev
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.error('📤 API Request Error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor for logging and error handling
    this.api.interceptors.response.use(
      (response) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log(`📥 API Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        // Always log minimal error info
        // eslint-disable-next-line no-console
        console.error('📥 API Response Error:', error.response?.status, error.message);
        return Promise.reject(error);
      },
    );
  }

  protected handleApiError(error: any, defaultMessage: string): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        const message = error.response.data?.error || error.response.statusText || defaultMessage;
        return new Error(`${message} (${error.response.status})`);
      } else if (error.request) {
        // Request was made but no response received
        return new Error('Network error - please check your connection');
      }
    }

    // Other errors
    return new Error(error.message || defaultMessage);
  }

  /**
   * Get the configured base URL
   */
  getBaseUrl(): string {
    return this.baseURL;
  }
}

/**
 * HTTP client utilities
 */
export const httpClient = {
  /**
   * Check if error is a network error
   */
  isNetworkError: (error: AxiosError): boolean => {
    return !error.response && !!error.request;
  },

  /**
   * Check if error is a timeout error
   */
  isTimeoutError: (error: AxiosError): boolean => {
    return error.code === 'ECONNABORTED';
  },

  /**
   * Get error message from API error
   */
  getErrorMessage: (error: AxiosError): string => {
    if (error.response?.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
      return (error.response.data as any).error;
    }
    if (error.response?.statusText) {
      return error.response.statusText;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },
};
