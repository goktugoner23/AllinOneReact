import * as React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

interface TextProps extends RNTextProps {
  variant?: 'default' | 'muted' | 'destructive';
}

const Text = React.forwardRef<RNText, TextProps>(({ style, variant = 'default', ...props }, ref) => {
  const theme = useTheme();

  const variantStyles = {
    default: { color: theme.colors.onSurface },
    muted: { color: theme.colors.onSurfaceVariant },
    destructive: { color: theme.colors.error },
  };

  return <RNText ref={ref} style={[styles.base, variantStyles[variant], style]} {...props} />;
});

Text.displayName = 'Text';

const styles = StyleSheet.create({
  base: {
    fontSize: 16,
  },
});

export { Text };
export type { TextProps };
