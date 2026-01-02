import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '@shared/theme';

export interface SwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Switch({ value, onChange, label, description, disabled = false, size = 'md', style }: SwitchProps) {
  const colors = useColors();

  const sizes: Record<string, { width: number; height: number; knob: number }> = {
    sm: { width: 36, height: 20, knob: 16 },
    md: { width: 48, height: 28, knob: 24 },
  };

  const sizeValues = sizes[size];

  const trackStyle: ViewStyle = {
    width: sizeValues.width,
    height: sizeValues.height,
    borderRadius: sizeValues.height / 2,
    backgroundColor: value ? colors.primary : colors.muted,
    justifyContent: 'center',
    paddingHorizontal: 2,
    opacity: disabled ? 0.5 : 1,
  };

  const knobStyle: ViewStyle = {
    width: sizeValues.knob,
    height: sizeValues.knob,
    borderRadius: sizeValues.knob / 2,
    backgroundColor: value ? colors.primaryForeground : colors.mutedForeground,
    alignSelf: value ? 'flex-end' : 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  };

  const handlePress = () => {
    if (!disabled) {
      onChange(!value);
    }
  };

  if (label || description) {
    return (
      <Pressable onPress={handlePress} disabled={disabled} style={[styles.container, style]}>
        <View style={styles.textContainer}>
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
          {description && <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>}
        </View>
        <View style={trackStyle}>
          <View style={knobStyle} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} disabled={disabled} style={[trackStyle, style]}>
      <View style={knobStyle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default Switch;
