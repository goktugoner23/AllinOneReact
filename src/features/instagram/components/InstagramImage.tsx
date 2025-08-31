/**
 * InstagramImage Component
 * A React Native component that safely displays Instagram images through proxy endpoints
 * Includes error handling, loading states, and fallback support
 */

import React, { useState, useEffect } from 'react';
import {
  Image,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  ImageStyle,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { createSafeProxyUrl, logProxyRequest, handleProxyError } from '@features/instagram/utils/instagramProxy';

export interface InstagramImageProps {
  /** Instagram image URL to display */
  instagramUrl: string;
  /** Style for the container view */
  style?: ViewStyle;
  /** Style for the image component */
  imageStyle?: ImageStyle;
  /** Fallback image URI if Instagram image fails to load */
  fallbackUri?: string;
  /** Callback when image fails to load */
  onError?: (url: string) => void;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Whether to show loading indicator */
  showLoadingIndicator?: boolean;
  /** Whether the image should be touchable */
  onPress?: () => void;
  /** Image resize mode */
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  /** Whether to enable long press for debugging */
  enableDebugLongPress?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom error component */
  errorComponent?: React.ReactNode;
}

const InstagramImage: React.FC<InstagramImageProps> = ({
  instagramUrl,
  style,
  imageStyle,
  fallbackUri,
  onError,
  onLoad,
  showLoadingIndicator = true,
  onPress,
  resizeMode = 'cover',
  enableDebugLongPress = __DEV__,
  loadingComponent,
  errorComponent,
}) => {
  const theme = useTheme();
  const [proxyUrl, setProxyUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  useEffect(() => {
    if (instagramUrl) {
      const proxiedUrl = createSafeProxyUrl(instagramUrl);
      setProxyUrl(proxiedUrl);
      
      if (__DEV__) {
        logProxyRequest(instagramUrl, proxiedUrl);
      }
      
      // Reset states when URL changes
      setHasError(false);
      setIsLoading(true);
    }
  }, [instagramUrl]);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    onLoad && onLoad();
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    
    const error = new Error(`Failed to load Instagram image: ${instagramUrl}`);
    handleProxyError(instagramUrl, error);
    onError && onError(instagramUrl);
  };

  const handleRetry = () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    setHasError(false);
    setIsLoading(true);
    
    // Force a new proxy URL generation
    const newProxyUrl = createSafeProxyUrl(instagramUrl);
    setProxyUrl(newProxyUrl);
    
    setTimeout(() => {
      setIsRetrying(false);
    }, 1000);
  };

  const handleDebugLongPress = () => {
    if (enableDebugLongPress && __DEV__) {
      Alert.alert(
        'Instagram Image Debug',
        `Original: ${instagramUrl}\n\nProxy: ${proxyUrl}\n\nStatus: ${hasError ? 'Error' : isLoading ? 'Loading' : 'Loaded'}`,
        [
          { text: 'Copy Original', onPress: () => console.log('Original URL:', instagramUrl) },
          { text: 'Copy Proxy', onPress: () => console.log('Proxy URL:', proxyUrl) },
          { text: 'Retry', onPress: handleRetry },
          { text: 'Close', style: 'cancel' },
        ]
      );
    }
  };

  // Render error state
  if (hasError) {
    if (fallbackUri) {
      return (
        <TouchableOpacity 
          style={[styles.container, style]} 
          onPress={onPress}
          onLongPress={handleDebugLongPress}
          activeOpacity={onPress ? 0.7 : 1}
        >
          <Image
            source={{ uri: fallbackUri }}
            style={[styles.image, imageStyle]}
            resizeMode={resizeMode}
          />
        </TouchableOpacity>
      );
    }

    if (errorComponent) {
      return (
        <View style={[styles.container, style]}>
          {errorComponent}
        </View>
      );
    }

    return (
      <TouchableOpacity 
        style={[styles.container, styles.errorContainer, style, { backgroundColor: theme.colors.errorContainer }]}
        onPress={handleRetry}
        onLongPress={handleDebugLongPress}
      >
        <Text style={[styles.errorText, { color: theme.colors.onErrorContainer }]}>
          Failed to load image
        </Text>
        <Text style={[styles.retryText, { color: theme.colors.onErrorContainer }]}>
          Tap to retry
        </Text>
      </TouchableOpacity>
    );
  }

  // Main image component
  const imageComponent = (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: proxyUrl }}
        style={[styles.image, imageStyle, isLoading && styles.hidden]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleImageError}
        resizeMode={resizeMode}
      />
      
      {/* Loading overlay */}
      {isLoading && showLoadingIndicator && (
        <View style={[styles.loadingOverlay, style]}>
          {loadingComponent || (
            <>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              {isRetrying && (
                <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
                  Retrying...
                </Text>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );

  // Wrap with TouchableOpacity if onPress is provided
  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress}
        onLongPress={handleDebugLongPress}
        activeOpacity={0.7}
      >
        {imageComponent}
      </TouchableOpacity>
    );
  }

  // Add long press for debugging even without onPress
  if (enableDebugLongPress && __DEV__) {
    return (
      <TouchableOpacity 
        onLongPress={handleDebugLongPress}
        activeOpacity={1}
      >
        {imageComponent}
      </TouchableOpacity>
    );
  }

  return imageComponent;
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hidden: {
    opacity: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  retryText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default InstagramImage;

/**
 * Higher-order component for Instagram images with fallback
 */
export const InstagramImageWithFallback: React.FC<InstagramImageProps & { 
  fallbackSrc: string;
}> = ({ fallbackSrc, ...props }) => {
  return <InstagramImage {...props} fallbackUri={fallbackSrc} />;
};

/**
 * Optimized Instagram image for use in lists (FlatList, etc.)
 */
export const InstagramImageOptimized: React.FC<InstagramImageProps> = React.memo(
  (props) => <InstagramImage {...props} />,
  (prevProps, nextProps) => {
    // Only re-render if essential props change
    return (
      prevProps.instagramUrl === nextProps.instagramUrl &&
      prevProps.style === nextProps.style &&
      prevProps.imageStyle === nextProps.imageStyle
    );
  }
);
