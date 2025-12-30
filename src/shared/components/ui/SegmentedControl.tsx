import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useColors, radius, spacing, textStyles, shadow } from '@shared/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface SegmentedControlOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'pills';
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  style,
}: SegmentedControlProps<T>) {
  const colors = useColors();

  const handlePress = (optionValue: T) => {
    if (optionValue !== value) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onChange(optionValue);
    }
  };

  const sizeStyles = {
    sm: { height: 32, paddingH: spacing[3], fontSize: textStyles.buttonSmall.fontSize },
    md: { height: 40, paddingH: spacing[4], fontSize: textStyles.button.fontSize },
    lg: { height: 48, paddingH: spacing[5], fontSize: textStyles.buttonLarge.fontSize },
  };

  const currentSize = sizeStyles[size];

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    borderRadius: variant === 'pills' ? radius.full : radius.lg,
    padding: spacing[1],
    ...(fullWidth && { alignSelf: 'stretch' }),
  };

  return (
    <View style={[containerStyle, style]}>
      {options.map((option, index) => {
        const isSelected = option.value === value;

        const segmentStyle: ViewStyle = {
          flex: fullWidth ? 1 : undefined,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: currentSize.height - spacing[2],
          paddingHorizontal: currentSize.paddingH,
          borderRadius: variant === 'pills' ? radius.full : radius.md,
          backgroundColor: isSelected ? colors.background : 'transparent',
          gap: spacing[2],
          ...(isSelected && shadow.sm),
        };

        const textStyle = {
          fontSize: currentSize.fontSize,
          fontWeight: isSelected ? ('600' as const) : ('500' as const),
          color: isSelected ? colors.foreground : colors.mutedForeground,
        };

        return (
          <Pressable
            key={String(option.value)}
            onPress={() => handlePress(option.value)}
            style={({ pressed }) => [segmentStyle, pressed && !isSelected && { opacity: 0.7 }]}
          >
            {option.icon}
            <Text style={textStyle}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default SegmentedControl;
