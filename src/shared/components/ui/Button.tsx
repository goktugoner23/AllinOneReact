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
import { useColors, radius, spacing, textStyles, componentSizes } from '@shared/theme';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export function Button({
  variant = 'default',
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
  const colors = useColors();
  const isDisabled = disabled || loading;

  const getBackgroundColor = (): string => {
    if (isDisabled) return colors.muted;
    switch (variant) {
      case 'default':
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'destructive':
        return colors.destructive;
      case 'success':
        return colors.success;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (isDisabled) return colors.mutedForeground;
    switch (variant) {
      case 'default':
      case 'primary':
        return colors.primaryForeground;
      case 'secondary':
        return colors.secondaryForeground;
      case 'destructive':
        return colors.destructiveForeground;
      case 'success':
        return colors.successForeground;
      case 'outline':
        return colors.foreground;
      case 'ghost':
        return colors.foreground;
      default:
        return colors.primaryForeground;
    }
  };

  const getBorderColor = (): string => {
    if (variant === 'outline') {
      return isDisabled ? colors.muted : colors.border;
    }
    return 'transparent';
  };

  const sizeStyles: Record<string, { height: number; paddingHorizontal: number; fontSize: number; iconSize: number }> =
    {
      sm: {
        height: componentSizes.buttonSm,
        paddingHorizontal: spacing[3],
        fontSize: textStyles.buttonSmall.fontSize ?? 12,
        iconSize: 16,
      },
      md: {
        height: componentSizes.buttonMd,
        paddingHorizontal: spacing[4],
        fontSize: textStyles.button.fontSize ?? 14,
        iconSize: 18,
      },
      lg: {
        height: componentSizes.buttonLg,
        paddingHorizontal: spacing[6],
        fontSize: textStyles.buttonLarge.fontSize ?? 16,
        iconSize: 20,
      },
      icon: {
        height: componentSizes.buttonMd,
        paddingHorizontal: 0,
        fontSize: 0,
        iconSize: 20,
      },
    };

  const currentSize = sizeStyles[size];

  const buttonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: getBackgroundColor(),
    borderColor: getBorderColor(),
    borderWidth: variant === 'outline' ? 1 : 0,
    borderRadius: radius.md,
    height: currentSize.height,
    paddingHorizontal: size === 'icon' ? 0 : currentSize.paddingHorizontal,
    width: size === 'icon' ? currentSize.height : fullWidth ? '100%' : undefined,
    opacity: isDisabled ? 0.5 : 1,
    gap: spacing[2],
  };

  const textStyle: TextStyle = {
    color: getTextColor(),
    fontSize: currentSize.fontSize,
    fontWeight: textStyles.button.fontWeight, // Use theme token for Soft Minimal (500)
  };

  return (
    <TouchableOpacity {...props} disabled={isDisabled} style={[buttonStyle, style as ViewStyle]} activeOpacity={0.85}>
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {leftIcon}
          {children && size !== 'icon' && <Text style={textStyle}>{children}</Text>}
          {size === 'icon' && children}
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

export default Button;
