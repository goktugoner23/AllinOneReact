/**
 * Utility functions for formatting various data types
 * Following DRY principles to avoid code duplication
 */

// Currency formatting with customizable options
export const formatCurrency = (amount: number | string, currency: string = 'USD', locale: string = 'en-US'): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return '$0.00';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

// Number formatting with customizable precision
export const formatNumber = (
  value: string | number,
  minimumFractionDigits: number = 0,
  maximumFractionDigits: number = 8,
  locale: string = 'en-US',
): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);
};

// Date formatting with customizable options
export const formatDate = (
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  locale: string = 'en-US',
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

// Percentage formatting
export const formatPercentage = (
  value: number,
  minimumFractionDigits: number = 2,
  maximumFractionDigits: number = 2,
): string => {
  if (isNaN(value)) {
    return '0%';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);
};

// Compact number formatting (1K, 1M, etc.)
export const formatCompactNumber = (value: number, locale: string = 'en-US'): string => {
  if (isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
};

// Time formatting
export const formatTime = (
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  },
  locale: string = 'en-US',
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Time';
  }

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/**
 * Strips HTML tags from text content
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return '';

  // Remove HTML tags
  const withoutTags = html.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  const decoded = withoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Remove extra whitespace
  return decoded.replace(/\s+/g, ' ').trim();
};
