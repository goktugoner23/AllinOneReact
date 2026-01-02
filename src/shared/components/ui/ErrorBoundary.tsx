import React, { Component, ReactNode, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, MD3Theme } from 'react-native-paper';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Theme context for class component
const ThemeContext = React.createContext<MD3Theme | null>(null);

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the child component tree
 * Following React Native guidelines for error handling
 */
class ErrorBoundaryClass extends Component<Props & { theme: MD3Theme }, State> {
  constructor(props: Props & { theme: MD3Theme }) {
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
    const { theme } = this.props;

    if (this.state.hasError) {
      // Return custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.errorTitle, { color: theme.colors.error }]}>Oops! Something went wrong</Text>
          <Text style={[styles.errorMessage, { color: theme.colors.onSurfaceVariant }]}>
            {__DEV__ && this.state.error ? this.state.error.message : 'An unexpected error occurred. Please try again.'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={this.handleRetry}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to provide theme to class component
export function ErrorBoundary(props: Props) {
  const theme = useTheme();
  return <ErrorBoundaryClass {...props} theme={theme} />;
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
