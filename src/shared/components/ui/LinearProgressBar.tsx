import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useColors } from '@shared/theme';

interface LinearProgressBarProps {
  visible?: boolean;
  color?: string;
  indeterminate?: boolean;
  progress?: number; // 0-1 for determinate mode
}

export default function LinearProgressBar({
  visible = true,
  color,
  indeterminate = true,
  progress = 0,
}: LinearProgressBarProps) {
  const colors = useColors();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && indeterminate) {
      const animation = Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animation.start();
      return () => animation.stop();
    }
    return undefined;
  }, [visible, indeterminate, animatedValue]);

  if (!visible) return null;

  const progressColor = color || colors.primary;

  if (indeterminate) {
    const translateX = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 400],
    });

    return (
      <View style={[styles.container, { backgroundColor: colors.muted }]}>
        <Animated.View
          style={[
            styles.indeterminateBar,
            {
              backgroundColor: progressColor,
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.muted }]}>
      <View
        style={[
          styles.determinateBar,
          {
            backgroundColor: progressColor,
            width: `${Math.min(100, Math.max(0, progress * 100))}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 4,
    zIndex: 1000,
    overflow: 'hidden',
    borderRadius: 2,
  },
  indeterminateBar: {
    height: 4,
    width: 100,
    borderRadius: 2,
  },
  determinateBar: {
    height: 4,
    borderRadius: 2,
  },
});
