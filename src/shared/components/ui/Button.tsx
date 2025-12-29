import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { cn } from '@shared/lib';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const getBackgroundColor = (): string => {
    if (isDisabled) return theme.colors.surfaceDisabled;
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondaryContainer;
      case 'destructive':
        return theme.colors.error;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (isDisabled) return theme.colors.onSurfaceDisabled;
    switch (variant) {
      case 'primary':
        return theme.colors.onPrimary;
      case 'secondary':
        return theme.colors.onSecondaryContainer;
      case 'destructive':
        return theme.colors.onError;
      case 'outline':
        return theme.colors.primary;
      case 'ghost':
        return theme.colors.onSurface;
      default:
        return theme.colors.onPrimary;
    }
  };

  const getBorderColor = (): string => {
    if (variant === 'outline') {
      return isDisabled ? theme.colors.surfaceDisabled : theme.colors.primary;
    }
    return 'transparent';
  };

  const sizeStyles: Record<string, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
    sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 14 },
    md: { paddingVertical: 12, paddingHorizontal: 16, fontSize: 16 },
    lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 18 },
  };

  const currentSize = sizeStyles[size];

  const buttonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: getBackgroundColor(),
    borderColor: getBorderColor(),
    borderWidth: variant === 'outline' ? 1.5 : 0,
    borderRadius: 12,
    paddingVertical: currentSize.paddingVertical,
    paddingHorizontal: currentSize.paddingHorizontal,
    opacity: isDisabled ? 0.6 : 1,
    gap: 8,
    ...(fullWidth && { width: '100%' }),
  };

  const textStyle: TextStyle = {
    color: getTextColor(),
    fontSize: currentSize.fontSize,
    fontWeight: '600',
  };

  return (
    <TouchableOpacity {...props} disabled={isDisabled} style={[buttonStyle, style as ViewStyle]} activeOpacity={0.7}>
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {leftIcon}
          <Text style={textStyle}>{children}</Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

export default Button;
