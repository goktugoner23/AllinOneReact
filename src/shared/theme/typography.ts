/**
 * Typography system inspired by shadcn/ui
 * Clear hierarchy with defined scales
 */

import { TextStyle, Platform } from 'react-native';

// Font families
export const fontFamily = {
  sans: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

// Font sizes with corresponding line heights
export const fontSize = {
  xs: { size: 12, lineHeight: 16 },
  sm: { size: 14, lineHeight: 20 },
  base: { size: 16, lineHeight: 24 },
  lg: { size: 18, lineHeight: 28 },
  xl: { size: 20, lineHeight: 28 },
  '2xl': { size: 24, lineHeight: 32 },
  '3xl': { size: 30, lineHeight: 36 },
  '4xl': { size: 36, lineHeight: 40 },
} as const;

// Font weights as strings for React Native
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

// Letter spacing
export const letterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
} as const;

// Pre-composed text styles for common use cases
export const textStyles = {
  // Headings
  h1: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
  } as TextStyle,
  h2: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '600',
    letterSpacing: -0.4,
  } as TextStyle,
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
  } as TextStyle,
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  } as TextStyle,

  // Body text
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  } as TextStyle,
  bodyLarge: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  } as TextStyle,
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  } as TextStyle,

  // Caption and labels
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  } as TextStyle,
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  } as TextStyle,
  labelSmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  } as TextStyle,

  // Button text
  button: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  } as TextStyle,
  buttonSmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  } as TextStyle,
  buttonLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  } as TextStyle,

  // Monospace (for code, numbers)
  mono: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    fontFamily: fontFamily.mono,
  } as TextStyle,

  // Financial amounts
  amount: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    fontFamily: fontFamily.mono,
  } as TextStyle,
  amountLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    fontFamily: fontFamily.mono,
  } as TextStyle,
  amountSmall: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  } as TextStyle,
} as const;

export type TextStyleKey = keyof typeof textStyles;
