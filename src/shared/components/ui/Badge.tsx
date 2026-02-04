import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useColors, radius, spacing, textStyles } from '@shared/theme';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'income' | 'expense' | 'info';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function Badge({ children, variant = 'default', size = 'md', style }: BadgeProps) {
  const colors = useColors();

  const getColors = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
      case 'default':
        return { bg: colors.primaryMuted, text: colors.primary };
      case 'secondary':
        return { bg: colors.secondary, text: colors.secondaryForeground };
      case 'success':
        return { bg: colors.successMuted, text: colors.success };
      case 'warning':
        return { bg: colors.warningMuted, text: colors.warning };
      case 'destructive':
        return { bg: colors.destructiveMuted, text: colors.destructive };
      case 'outline':
        return { bg: 'transparent', text: colors.foreground, border: colors.border };
      case 'income':
        return { bg: colors.incomeMuted, text: colors.income };
      case 'expense':
        return { bg: colors.expenseMuted, text: colors.expense };
      case 'info':
        return { bg: colors.infoMuted, text: colors.info };
      default:
        return { bg: colors.secondary, text: colors.secondaryForeground };
    }
  };

  const sizeStyles: Record<string, { paddingV: number; paddingH: number; fontSize: number }> = {
    sm: { paddingV: spacing[0.5], paddingH: spacing[2], fontSize: (textStyles.caption.fontSize ?? 12) - 2 },
    md: { paddingV: spacing[1], paddingH: spacing[2.5], fontSize: textStyles.caption.fontSize ?? 12 },
    lg: { paddingV: spacing[1.5], paddingH: spacing[3], fontSize: textStyles.bodySmall.fontSize ?? 14 },
  };

  const badgeColors = getColors();
  const sizing = sizeStyles[size];

  const badgeStyle: ViewStyle = {
    backgroundColor: badgeColors.bg,
    paddingVertical: sizing.paddingV,
    paddingHorizontal: sizing.paddingH,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    ...(badgeColors.border && {
      borderWidth: 1,
      borderColor: badgeColors.border,
    }),
  };

  const badgeTextStyle: TextStyle = {
    color: badgeColors.text,
    fontSize: sizing.fontSize,
    fontWeight: '500',
    lineHeight: sizing.fontSize * 1.2,
  };

  return (
    <View style={[badgeStyle, style]}>
      <Text style={badgeTextStyle}>{children}</Text>
    </View>
  );
}

export default Badge;
