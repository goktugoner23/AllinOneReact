/**
 * Instagram Proxy Utilities
 * Handles URL generation and management for Instagram proxy endpoints
 * Following the guide in AllinOneReact Instagram Proxy Integration Guide
 */

import { InstagramApiService } from '@features/instagram/services/InstagramApiService';

// Get the base URL from the Instagram API service
const getBaseUrl = (): string => {
  // Use the same base URL as the Instagram API service
  return __DEV__ 
    ? 'http://129.212.143.6:3000' 
    : 'http://129.212.143.6:3000';
};

/**
 * Creates a proxy URL for Instagram images
 * Replaces direct Instagram URLs to avoid CORS issues
 */
export const createInstagramImageProxyUrl = (instagramUrl: string): string => {
  if (!instagramUrl || typeof instagramUrl !== 'string') {
    console.warn('Invalid Instagram URL provided to proxy:', instagramUrl);
    return '';
  }

  // If it's already a proxy URL, return it as-is
  if (instagramUrl.includes('/api/instagram/image-proxy')) {
    return instagramUrl;
  }

  const baseUrl = getBaseUrl();
  const encodedUrl = encodeURIComponent(instagramUrl);
  return `${baseUrl}/api/instagram/image-proxy?url=${encodedUrl}`;
};

/**
 * Creates proxy URLs for multiple Instagram images
 */
export const createInstagramImageProxyUrls = (urls: string[]): string[] => {
  return urls.map(url => createInstagramImageProxyUrl(url));
};

/**
 * Checks if a URL is a valid Instagram CDN URL
 */
export const isInstagramUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  const instagramDomains = [
    'cdninstagram.com',
    'instagram.com',
    'fbcdn.net',
    'scontent',
    'instagram.fcdn.net'
  ];
  
  return instagramDomains.some(domain => url.includes(domain));
};

/**
 * Safely creates a proxy URL only for Instagram URLs
 * Returns original URL if it's not from Instagram
 */
export const createSafeProxyUrl = (url: string): string => {
  if (!url) return '';
  
  // If it's an Instagram URL, use proxy
  if (isInstagramUrl(url)) {
    return createInstagramImageProxyUrl(url);
  }
  
  // Return original URL for non-Instagram sources
  return url;
};

/**
 * Batch processing utility for multiple URLs
 */
export const processInstagramUrls = (urls: string[]): Array<{ original: string; proxy: string }> => {
  return urls.map(url => ({
    original: url,
    proxy: createSafeProxyUrl(url)
  }));
};

/**
 * Creates a proxy URL for Instagram stories
 * This is handled differently as stories come from the backend API
 */
export const createStoriesProxyUrl = (username: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/instagram/stories/${encodeURIComponent(username)}`;
};

/**
 * Creates a proxy URL for Instagram profile pictures
 * This is handled differently as profile pictures come from the backend API
 */
export const createProfilePictureProxyUrl = (username: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/instagram/profile-picture/${encodeURIComponent(username)}`;
};

/**
 * Utility to determine the best quality image URL from available options
 */
export const getBestImageUrl = (mediaUrl?: string, thumbnailUrl?: string): string => {
  // Prefer full media URL over thumbnail
  const bestUrl = mediaUrl || thumbnailUrl || '';
  return createSafeProxyUrl(bestUrl);
};

/**
 * Debugging utility to log proxy URL generation
 */
export const logProxyRequest = (originalUrl: string, proxyUrl: string): void => {
  if (__DEV__) {
    console.log('Instagram Proxy Request:', {
      original: originalUrl,
      proxy: proxyUrl,
      timestamp: new Date().toISOString(),
      isInstagram: isInstagramUrl(originalUrl)
    });
  }
};

/**
 * Error handling utility for proxy URLs
 */
export const handleProxyError = (url: string, error: Error): void => {
  console.error('Instagram Proxy Error:', {
    url,
    error: error.message,
    timestamp: new Date().toISOString()
  });
};
