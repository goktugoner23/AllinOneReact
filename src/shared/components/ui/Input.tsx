import React, { useState, forwardRef } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps, Pressable, TextStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors, radius, spacing, textStyles, componentSizes } from '@shared/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  variant?: 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerStyle,
      variant = 'outlined',
      size = 'md',
      secureTextEntry,
      style,
      ...props
    },
    ref,
  ) => {
    const colors = useColors();
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const hasError = !!error;

    const sizeConfig = {
      sm: {
        height: componentSizes.inputSm,
        fontSize: textStyles.bodySmall.fontSize,
        labelSize: textStyles.caption.fontSize,
      },
      md: { height: componentSizes.inputMd, fontSize: textStyles.body.fontSize, labelSize: textStyles.label.fontSize },
      lg: {
        height: componentSizes.inputLg,
        fontSize: textStyles.bodyLarge.fontSize,
        labelSize: textStyles.label.fontSize,
      },
    };

    const currentSize = sizeConfig[size];

    const getBorderColor = () => {
      if (hasError) return colors.destructive;
      if (isFocused) return colors.primary;
      return colors.border;
    };

    const getBackgroundColor = () => {
      if (variant === 'filled') {
        return colors.muted;
      }
      return colors.background;
    };

    const inputContainerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getBackgroundColor(),
      borderWidth: 1,
      borderColor: getBorderColor(),
      borderRadius: radius.md,
      paddingHorizontal: spacing[3],
      minHeight: currentSize.height,
      gap: spacing[2],
      // Focus ring effect - softer using borderFocus
      ...(isFocused && {
        borderWidth: 2,
        borderColor: hasError ? colors.destructive : colors.borderFocus,
      }),
    };

    const labelStyle: TextStyle = {
      fontSize: currentSize.labelSize,
      fontWeight: '500',
      marginBottom: spacing[1.5],
      color: hasError ? colors.destructive : isFocused ? colors.primary : colors.foreground,
    };

    const inputStyle: TextStyle = {
      flex: 1,
      fontSize: currentSize.fontSize,
      color: colors.foreground,
      paddingVertical: spacing[2],
    };

    const helperTextStyle: TextStyle = {
      fontSize: textStyles.caption.fontSize,
      marginTop: spacing[1],
      marginLeft: spacing[0.5],
      color: hasError ? colors.destructive : colors.mutedForeground,
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={labelStyle}>{label}</Text>}
        <View style={inputContainerStyle}>
          {leftIcon}
          <TextInput
            ref={ref}
            {...props}
            style={[inputStyle, style]}
            placeholderTextColor={colors.foregroundSubtle}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            cursorColor={colors.primary}
            selectionColor={colors.primaryMuted}
          />
          {secureTextEntry && (
            <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)} hitSlop={8}>
              <Ionicons
                name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.mutedForeground}
              />
            </Pressable>
          )}
          {rightIcon}
        </View>
        {(error || helperText) && <Text style={helperTextStyle}>{error || helperText}</Text>}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
});

export default Input;
