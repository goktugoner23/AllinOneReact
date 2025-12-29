/**
 * Shared constants used across multiple features
 */

// App Configuration
export const APP_CONFIG = {
  NAME: 'AllInOne',
  VERSION: '1.0.0',
  BUNDLE_ID: 'com.allinone.app',
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  THEME_MODE: 'theme_mode',
  LAST_SYNC: 'last_sync',
  CACHED_DATA: 'cached_data',
  APP_VERSION: 'app_version',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

// Theme Constants
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Animation Durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

// Screen Dimensions
export const SCREEN_BREAKPOINTS = {
  SMALL: 320,
  MEDIUM: 768,
  LARGE: 1024,
  EXTRA_LARGE: 1440,
} as const;

// Common Spacing Values
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
} as const;

// Font Sizes
export const FONT_SIZES = {
  XS: 10,
  SM: 12,
  MD: 14,
  LG: 16,
  XL: 18,
  XXL: 20,
  XXXL: 24,
  TITLE: 28,
  LARGE_TITLE: 32,
} as const;

// Border Radius Values
export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  ROUND: 50,
} as const;

// Z-Index Values
export const Z_INDEX = {
  BACKGROUND: -1,
  DEFAULT: 0,
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// File Upload Limits
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  ALLOWED_DOCUMENT_TYPES: ['pdf', 'doc', 'docx', 'txt'],
  ALLOWED_AUDIO_TYPES: ['mp3', 'wav', 'ogg', 'm4a'],
  ALLOWED_VIDEO_TYPES: ['mp4', 'mov', 'avi', 'mkv'],
} as const;

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MM/dd/yyyy',
  MEDIUM: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  FULL: 'EEEE, MMMM dd, yyyy',
  TIME_12: 'hh:mm a',
  TIME_24: 'HH:mm',
  DATETIME: 'MMM dd, yyyy hh:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  EMAIL_MAX_LENGTH: 254,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  TEXT_AREA_MAX_LENGTH: 1000,
  TITLE_MAX_LENGTH: 100,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVED: 'Successfully saved!',
  UPDATED: 'Successfully updated!',
  DELETED: 'Successfully deleted!',
  CREATED: 'Successfully created!',
  UPLOADED: 'Successfully uploaded!',
  SENT: 'Successfully sent!',
} as const;

// Loading Messages
export const LOADING_MESSAGES = {
  LOADING: 'Loading...',
  SAVING: 'Saving...',
  UPDATING: 'Updating...',
  DELETING: 'Deleting...',
  UPLOADING: 'Uploading...',
  PROCESSING: 'Processing...',
  SYNCING: 'Syncing...',
} as const;

// Feature Flags (for development)
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: true,
  ENABLE_CRASH_REPORTING: true,
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_DEBUG_LOGGING: __DEV__,
} as const;

// External URLs
export const EXTERNAL_URLS = {
  PRIVACY_POLICY: 'https://example.com/privacy',
  TERMS_OF_SERVICE: 'https://example.com/terms',
  SUPPORT: 'https://example.com/support',
  FEEDBACK: 'https://example.com/feedback',
} as const;
