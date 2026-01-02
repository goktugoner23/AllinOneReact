import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors as themeColors } from '@shared/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Get colors based on color scheme
const getColors = () => {
  // Default to light mode colors for error boundary since it's a class component
  return themeColors.light;
};

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the child component tree
 * Following React Native guidelines for error handling
 */
class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to crash reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would report this to your error tracking service
    if (!__DEV__) {
      // Example: Crashlytics.recordError(error);
      // Example: Sentry.captureException(error);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    const colors = getColors();

    if (this.state.hasError) {
      // Return custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorTitle, { color: colors.destructive }]}>Oops! Something went wrong</Text>
          <Text style={[styles.errorMessage, { color: colors.mutedForeground }]}>
            {__DEV__ && this.state.error ? this.state.error.message : 'An unexpected error occurred. Please try again.'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={this.handleRetry}
          >
            <Text style={[styles.retryButtonText, { color: colors.primaryForeground }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Export with same name for compatibility
export function ErrorBoundary(props: Props) {
  return <ErrorBoundaryClass {...props} />;
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

// Custom hook for handling async errors in functional components
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);

    // In production, report to error tracking service
    if (!__DEV__) {
      // Example: Crashlytics.recordError(error);
      // Example: Sentry.captureException(error, { extra: { context } });
    }
  };

  return { handleError };
};
