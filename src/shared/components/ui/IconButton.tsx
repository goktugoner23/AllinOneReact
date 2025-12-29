import React from 'react';
import { Pressable, StyleSheet, ViewStyle, PressableProps, ActivityIndicator } from 'react-native';
import { useTheme } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

export interface IconButtonProps extends PressableProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined' | 'ghost';
  color?: string;
  loading?: boolean;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  size = 'md',
  variant = 'default',
  color,
  loading = false,
  disabled,
  style,
  ...props
}: IconButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const sizes: Record<string, { button: number; icon: number }> = {
    sm: { button: 32, icon: 18 },
    md: { button: 44, icon: 24 },
    lg: { button: 56, icon: 28 },
  };

  const sizeValues = sizes[size];

  const getColors = () => {
    const baseColor = color || theme.colors.onSurface;
    switch (variant) {
      case 'filled':
        return {
          bg: theme.colors.primary,
          icon: theme.colors.onPrimary,
        };
      case 'outlined':
        return {
          bg: 'transparent',
          icon: baseColor,
          border: theme.colors.outline,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          icon: baseColor,
        };
      default:
        return {
          bg: theme.colors.surfaceVariant,
          icon: baseColor,
        };
    }
  };

  const colors = getColors();

  const buttonStyle: ViewStyle = {
    width: sizeValues.button,
    height: sizeValues.button,
    borderRadius: sizeValues.button / 2,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isDisabled ? 0.5 : 1,
    ...(variant === 'outlined' && {
      borderWidth: 1,
      borderColor: colors.border,
    }),
  };

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={({ pressed }) => [buttonStyle, pressed && { opacity: 0.7 }, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.icon} />
      ) : (
        <Ionicons name={icon} size={sizeValues.icon} color={colors.icon} />
      )}
    </Pressable>
  );
}

export default IconButton;
