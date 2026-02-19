/**
 * Format numbers for display (1000 -> 1K, 1000000 -> 1M)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Format engagement rate as percentage
 */
export const formatEngagementRate = (rate: number): string => {
  return `${rate.toFixed(1)}%`;
};

/**
 * Get media type icon name for Ionicons
 */
export const getMediaTypeIcon = (mediaType: string): string => {
  switch (mediaType.toUpperCase()) {
    case 'VIDEO':
      return 'play-circle-outline';
    case 'CAROUSEL_ALBUM':
      return 'images-outline';
    case 'REELS':
      return 'videocam-outline';
    case 'IMAGE':
    default:
      return 'image-outline';
  }
};

/**
 * Format timestamp to readable date
 */
export const formatDate = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    return 'Unknown date';
  }
};

/**
 * Format timestamp to relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
      }
      return diffInHours === 1 ? '1h ago' : `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else {
      return formatDate(timestamp);
    }
  } catch (error) {
    return 'Unknown time';
  }
};

/**
 * Get user-friendly error message from InstagramResult
 */
export const getErrorMessage = (error: string): string => {
  if (error.includes('Network Error') || error.includes('network')) {
    return 'Please check your internet connection and try again.';
  } else if (error.includes('timeout') || error.includes('Timeout')) {
    return 'Request timed out. Please try again.';
  } else if (error.includes('404') || error.includes('not found')) {
    return 'The requested data was not found.';
  } else if (error.includes('500') || error.includes('Internal Server Error')) {
    return 'Server error. Please try again later.';
  } else if (error.includes('401') || error.includes('Unauthorized')) {
    return 'Authentication failed. Please check your credentials.';
  } else if (error.includes('403') || error.includes('Forbidden')) {
    return 'Access denied. You may not have permission to view this data.';
  } else {
    return error || 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Get color for growth percentage
 */
export const getGrowthColor = (growth: number): string => {
  if (growth > 0) return '#4CAF50'; // Green for positive growth
  if (growth < 0) return '#F44336'; // Red for negative growth
  return '#757575'; // Gray for no change
};

/**
 * Ensure a single leading # and trim whitespace for hashtag display
 */
export const formatHashtagForDisplay = (tag: string): string => {
  if (!tag) return '#';
  const trimmed = tag.trim();
  const withoutHashes = trimmed.replace(/^#+/, '');
  return `#${withoutHashes}`;
};

