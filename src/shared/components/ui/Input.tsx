import React, { useState, forwardRef } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps, Pressable } from 'react-native';
import { useTheme } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  variant?: 'outlined' | 'filled';
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
      secureTextEntry,
      style,
      ...props
    },
    ref,
  ) => {
    const theme = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const hasError = !!error;

    const getBorderColor = () => {
      if (hasError) return theme.colors.error;
      if (isFocused) return theme.colors.primary;
      return theme.colors.outline;
    };

    const getBackgroundColor = () => {
      if (variant === 'filled') {
        return theme.colors.surfaceVariant;
      }
      return 'transparent';
    };

    const inputContainerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getBackgroundColor(),
      borderWidth: variant === 'outlined' ? 1.5 : 0,
      borderBottomWidth: 1.5,
      borderColor: getBorderColor(),
      borderRadius: variant === 'outlined' ? 12 : 0,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      paddingHorizontal: 16,
      minHeight: 56,
      gap: 12,
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text
            style={[
              styles.label,
              {
                color: hasError ? theme.colors.error : isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {label}
          </Text>
        )}
        <View style={inputContainerStyle}>
          {leftIcon}
          <TextInput
            ref={ref}
            {...props}
            style={[styles.input, { color: theme.colors.onSurface }, style]}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
          />
          {secureTextEntry && (
            <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)} hitSlop={8}>
              <Ionicons
                name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={theme.colors.onSurfaceVariant}
              />
            </Pressable>
          )}
          {rightIcon}
        </View>
        {(error || helperText) && (
          <Text style={[styles.helperText, { color: hasError ? theme.colors.error : theme.colors.onSurfaceVariant }]}>
            {error || helperText}
          </Text>
        )}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input;
