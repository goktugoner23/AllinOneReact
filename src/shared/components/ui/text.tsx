import * as React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useColors } from '@shared/theme';

interface TextProps extends RNTextProps {
  variant?: 'default' | 'muted' | 'destructive';
}

const Text = React.forwardRef<RNText, TextProps>(({ style, variant = 'default', ...props }, ref) => {
  const colors = useColors();

  const variantStyles = {
    default: { color: colors.foreground },
    muted: { color: colors.mutedForeground },
    destructive: { color: colors.destructive },
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
