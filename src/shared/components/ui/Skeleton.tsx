import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '@shared/theme';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  variant?: 'text' | 'rectangular' | 'circular';
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius, variant = 'text', style }: SkeletonProps) {
  const colors = useColors();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const getRadius = () => {
    if (borderRadius !== undefined) return borderRadius;
    switch (variant) {
      case 'circular':
        return height / 2;
      case 'text':
        return 4;
      case 'rectangular':
        return 8;
      default:
        return 4;
    }
  };

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonStyle: ViewStyle = {
    width: typeof width === 'number' ? width : undefined,
    height,
    borderRadius: getRadius(),
    backgroundColor: colors.muted,
  };

  return <Animated.View style={[skeletonStyle, { opacity }, typeof width === 'string' && { flex: 1 }, style]} />;
}

export interface SkeletonGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function SkeletonGroup({ children, style }: SkeletonGroupProps) {
  return <View style={[styles.group, style]}>{children}</View>;
}

// Pre-built skeleton patterns
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton variant="circular" width={48} height={48} />
        <View style={styles.cardHeaderText}>
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Skeleton width="100%" height={16} style={{ marginTop: 16 }} />
      <Skeleton width="80%" height={16} style={{ marginTop: 8 }} />
      <Skeleton width="60%" height={16} style={{ marginTop: 8 }} />
    </View>
  );
}

export function SkeletonListItem() {
  return (
    <View style={styles.listItem}>
      <Skeleton variant="circular" width={40} height={40} />
      <View style={styles.listItemContent}>
        <Skeleton width={150} height={16} />
        <Skeleton width={100} height={12} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  card: {
    padding: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listItemContent: {
    marginLeft: 12,
    flex: 1,
  },
});

export default Skeleton;
