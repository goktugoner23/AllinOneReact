import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, PressableProps } from 'react-native';
import { useTheme } from 'react-native-paper';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  onPress?: PressableProps['onPress'];
  onLongPress?: PressableProps['onLongPress'];
}

export function Card({ children, variant = 'elevated', padding = 'md', style, onPress, onLongPress }: CardProps) {
  const theme = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated':
        return theme.colors.elevation.level1;
      case 'filled':
        return theme.colors.surfaceVariant;
      case 'outlined':
        return theme.colors.surface;
      default:
        return theme.colors.surface;
    }
  };

  const paddingSizes: Record<string, number> = {
    none: 0,
    sm: 8,
    md: 16,
    lg: 24,
  };

  const cardStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: 16,
    padding: paddingSizes[padding],
    ...(variant === 'outlined' && {
      borderWidth: 1,
      borderColor: theme.colors.outline,
    }),
    ...(variant === 'elevated' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    }),
  };

  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [cardStyle, style, pressed && { opacity: 0.9 }]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}

export interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  return <View style={[styles.cardHeader, style]}>{children}</View>;
}

export interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardContent({ children, style }: CardContentProps) {
  return <View style={[styles.cardContent, style]}>{children}</View>;
}

export interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardFooter({ children, style }: CardFooterProps) {
  return <View style={[styles.cardFooter, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  cardHeader: {
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});

export default Card;
