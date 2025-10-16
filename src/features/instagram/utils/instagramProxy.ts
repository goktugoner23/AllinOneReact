/**
 * Instagram Proxy Utilities
 * Handles URL generation and management for Instagram proxy endpoints
 * Following the guide in AllinOneReact Instagram Proxy Integration Guide
 */

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

  // If it's already a proxy URL from our backend, return it as-is
  const baseUrl = getBaseUrl();
  if (instagramUrl.includes('/api/instagram/image-proxy') ||
      instagramUrl.startsWith(baseUrl)) {
    if (__DEV__) {
      console.log('🔗 URL is already proxied, returning as-is');
    }
    return instagramUrl;
  }

  const encodedUrl = encodeURIComponent(instagramUrl);
  const proxiedUrl = `${baseUrl}/api/instagram/image-proxy?url=${encodedUrl}`;

  if (__DEV__) {
    console.log('🔗 Creating proxy URL:', {
      base: baseUrl,
      encoded: encodedUrl.substring(0, 50)
    });
  }

  return proxiedUrl;
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
  if (!url || typeof url !== 'string') {
    if (__DEV__) {
      console.warn('🔍 isInstagramUrl: Invalid URL type:', typeof url);
    }
    return false;
  }

  // Instagram and Facebook CDN domains
  // Includes domains used by both regular Instagram and Instagram Business accounts (Graph API)
  const instagramDomains = [
    'cdninstagram.com',
    'instagram.com',
    'fbcdn.net',
    'scontent',
    'instagram.fcdn.net',
    'facebook.com',  // Graph API media URLs
    'fbsbx.com',     // Facebook sandbox
    'xx.fbcdn.net',  // Facebook CDN variant
    'scontent-',     // Prefix for regional CDN servers
    'graph.facebook.com',  // Direct Graph API URLs
    'graph.instagram.com'  // Instagram Graph API
  ];

  const isIg = instagramDomains.some(domain => url.includes(domain));

  if (__DEV__ && !isIg) {
    console.log('🔍 URL does not match Instagram domains:', {
      urlPreview: url.substring(0, 100),
      checkedDomains: instagramDomains
    });
  }

  return isIg;
};

/**
 * Safely creates a proxy URL only for Instagram URLs
 * Returns original URL if it's not from Instagram
 *
 * TEMPORARY FIX: Proxy is currently unreliable (502 errors),
 * so we're using direct URLs until proxy is fixed
 */
export const createSafeProxyUrl = (url: string): string => {
  if (!url) {
    if (__DEV__) {
      console.warn('🔗 createSafeProxyUrl: Empty URL provided');
    }
    return '';
  }

  // TEMPORARY: Return direct URLs to avoid proxy 502 errors
  // TODO: Re-enable proxy once backend image-proxy endpoint is fixed
  if (__DEV__) {
    console.log('🔗 Using direct URL (proxy disabled):', {
      urlPreview: url.substring(0, 100),
      urlLength: url.length
    });
  }
  return url;

  /* DISABLED PROXY CODE - Uncomment when proxy is fixed
  // If it's an Instagram URL, use proxy
  const isIgUrl = isInstagramUrl(url);

  if (__DEV__) {
    console.log('🔗 createSafeProxyUrl:', {
      isInstagramUrl: isIgUrl,
      urlPreview: url.substring(0, 100),
      urlLength: url.length
    });
  }

  if (isIgUrl) {
    const proxiedUrl = createInstagramImageProxyUrl(url);
    if (__DEV__) {
      console.log('🔗 Proxied URL created:', {
        original: url.substring(0, 100),
        proxied: proxiedUrl.substring(0, 100)
      });
    }
    return proxiedUrl;
  }

  // Return original URL for non-Instagram sources
  if (__DEV__) {
    console.log('🔗 Non-Instagram URL, returning as-is:', url.substring(0, 100));
  }
  return url;
  */
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
