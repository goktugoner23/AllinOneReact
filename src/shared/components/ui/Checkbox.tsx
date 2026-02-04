import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors, radius, spacing, textStyles, componentSizes } from '@shared/theme';
import { Text } from './text';

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function Checkbox({
  checked,
  onCheckedChange,
  disabled = false,
  label,
  size = 'md',
  style,
}: CheckboxProps) {
  const colors = useColors();

  const sizes: Record<string, { box: number; icon: number }> = {
    sm: { box: 18, icon: 12 },
    md: { box: 22, icon: 16 },
    lg: { box: 26, icon: 20 },
  };

  const sizeValues = sizes[size];

  const handlePress = () => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  const boxStyle: ViewStyle = {
    width: sizeValues.box,
    height: sizeValues.box,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: checked ? colors.primary : colors.border,
    backgroundColor: checked ? colors.primary : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
  };

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: componentSizes.touchTarget,
    gap: spacing[2],
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[containerStyle, style]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View style={boxStyle}>
        {checked && (
          <Ionicons
            name="checkmark"
            size={sizeValues.icon}
            color={colors.primaryForeground}
          />
        )}
      </View>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: disabled ? colors.mutedForeground : colors.foreground,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    ...textStyles.body,
  },
});

export default Checkbox;
