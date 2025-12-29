import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function Badge({ children, variant = 'default', size = 'md', style }: BadgeProps) {
  const theme = useTheme();

  const getColors = (): { bg: string; text: string } => {
    switch (variant) {
      case 'success':
        return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'warning':
        return { bg: '#FFF3E0', text: '#E65100' };
      case 'error':
        return { bg: '#FFEBEE', text: '#C62828' };
      case 'info':
        return { bg: '#E3F2FD', text: '#1565C0' };
      default:
        return {
          bg: theme.colors.secondaryContainer,
          text: theme.colors.onSecondaryContainer,
        };
    }
  };

  const sizeStyles: Record<string, { paddingV: number; paddingH: number; fontSize: number }> = {
    sm: { paddingV: 2, paddingH: 6, fontSize: 10 },
    md: { paddingV: 4, paddingH: 10, fontSize: 12 },
    lg: { paddingV: 6, paddingH: 14, fontSize: 14 },
  };

  const colors = getColors();
  const sizing = sizeStyles[size];

  const badgeStyle: ViewStyle = {
    backgroundColor: colors.bg,
    paddingVertical: sizing.paddingV,
    paddingHorizontal: sizing.paddingH,
    borderRadius: 999,
    alignSelf: 'flex-start',
  };

  const textStyle: TextStyle = {
    color: colors.text,
    fontSize: sizing.fontSize,
    fontWeight: '600',
  };

  return (
    <View style={[badgeStyle, style]}>
      <Text style={textStyle}>{children}</Text>
    </View>
  );
}

export default Badge;
