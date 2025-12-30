import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

export interface ChipProps {
  children: React.ReactNode;
  variant?: 'filled' | 'outlined';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'default';
  size?: 'sm' | 'md';
  selected?: boolean;
  onPress?: () => void;
  onClose?: () => void;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
}

export function Chip({
  children,
  variant = 'filled',
  color = 'default',
  size = 'md',
  selected = false,
  onPress,
  onClose,
  leftIcon,
  style,
}: ChipProps) {
  const theme = useTheme();

  const getColors = () => {
    const colors = {
      primary: {
        bg: theme.colors.primaryContainer,
        text: theme.colors.onPrimaryContainer,
        border: theme.colors.primary,
      },
      success: {
        bg: theme.colors.tertiaryContainer ?? theme.colors.primaryContainer,
        text: theme.colors.onTertiaryContainer ?? theme.colors.onPrimaryContainer,
        border: theme.colors.tertiary ?? theme.colors.primary,
      },
      warning: {
        bg: theme.colors.secondaryContainer,
        text: theme.colors.onSecondaryContainer,
        border: theme.colors.secondary,
      },
      error: {
        bg: theme.colors.errorContainer,
        text: theme.colors.onErrorContainer,
        border: theme.colors.error,
      },
      default: {
        bg: theme.colors.surfaceVariant,
        text: theme.colors.onSurfaceVariant,
        border: theme.colors.outline,
      },
    };
    return colors[color];
  };

  const chipColors = getColors();
  const isSmall = size === 'sm';

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isSmall ? 4 : 8,
    paddingHorizontal: isSmall ? 8 : 12,
    borderRadius: 999,
    backgroundColor: variant === 'filled' || selected ? chipColors.bg : 'transparent',
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: chipColors.border,
    gap: 6,
  };

  const textStyle = {
    color: chipColors.text,
    fontSize: isSmall ? 12 : 14,
    fontWeight: '500' as const,
  };

  const content = (
    <>
      {leftIcon}
      <Text style={textStyle}>{children}</Text>
      {onClose && (
        <Pressable onPress={onClose} hitSlop={4}>
          <Ionicons name="close-circle" size={isSmall ? 14 : 18} color={chipColors.text} />
        </Pressable>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [containerStyle, pressed && { opacity: 0.7 }, style]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[containerStyle, style]}>{content}</View>;
}

export interface ChipGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ChipGroup({ children, style }: ChipGroupProps) {
  return <View style={[styles.group, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

export default Chip;
