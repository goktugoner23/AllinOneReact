import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '@shared/theme';

export interface ProgressBarProps {
  progress: number; // 0-100
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showTrack?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  variant = 'default',
  size = 'md',
  animated = true,
  showTrack = true,
  style,
}: ProgressBarProps) {
  const colors = useColors();
  const animatedWidth = useRef(new Animated.Value(0)).current;

  const clampedProgress = Math.min(100, Math.max(0, progress));

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: clampedProgress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(clampedProgress);
    }
  }, [clampedProgress, animated, animatedWidth]);

  const getColor = () => {
    switch (variant) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.destructive;
      default:
        return colors.primary;
    }
  };

  const heights: Record<string, number> = {
    sm: 4,
    md: 8,
    lg: 12,
  };

  const height = heights[size];
  const color = getColor();

  const width = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: showTrack ? colors.muted : 'transparent',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.progress,
          {
            width,
            height,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

export interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function CircularProgress({
  progress,
  size = 64,
  strokeWidth = 4,
  color,
  trackColor,
  children,
  style,
}: CircularProgressProps) {
  const colors = useColors();
  const progressColor = color || colors.primary;
  const bgColor = trackColor || colors.muted;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View
      style={[
        styles.circularContainer,
        {
          width: size,
          height: size,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.circularTrack,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: bgColor,
          },
        ]}
      />
      <View
        style={[
          styles.circularProgress,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: progressColor,
            borderRightColor: 'transparent',
            borderBottomColor: clampedProgress > 25 ? progressColor : 'transparent',
            borderLeftColor: clampedProgress > 50 ? progressColor : 'transparent',
            borderTopColor: clampedProgress > 75 ? progressColor : 'transparent',
            transform: [{ rotate: `${(clampedProgress / 100) * 360}deg` }],
          },
        ]}
      />
      {children && <View style={styles.circularContent}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 999,
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularTrack: {
    position: 'absolute',
  },
  circularProgress: {
    position: 'absolute',
  },
  circularContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProgressBar;
