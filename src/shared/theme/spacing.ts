/**
 * Spacing system based on 4px grid
 * Inspired by Tailwind CSS / shadcn/ui
 */

import { ViewStyle } from 'react-native';

// Base spacing scale (4px grid)
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
} as const;

// Border radius scale - larger for softer corners (Soft Minimal)
export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
} as const;

// Shadow definitions for React Native - softer, subtler (Soft Minimal)
export const shadow = {
  none: {} as ViewStyle,
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  } as ViewStyle,
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  } as ViewStyle,
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  } as ViewStyle,
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  } as ViewStyle,
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 12,
  } as ViewStyle,
} as const;

// Component size presets
export const componentSizes = {
  // Button heights
  buttonSm: 32,
  buttonMd: 40,
  buttonLg: 48,
  buttonXl: 56,

  // Input heights
  inputSm: 32,
  inputMd: 40,
  inputLg: 48,

  // Icon sizes
  iconXs: 12,
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  iconXl: 32,

  // Avatar sizes
  avatarSm: 32,
  avatarMd: 40,
  avatarLg: 56,
  avatarXl: 80,

  // Touch target minimum
  touchTarget: 44,
} as const;

// Commonly used padding presets
export const padding = {
  card: spacing[4], // 16px
  cardSm: spacing[3], // 12px
  cardLg: spacing[6], // 24px
  screen: spacing[4], // 16px
  screenSm: spacing[3], // 12px
  section: spacing[6], // 24px
  item: spacing[3], // 12px
  itemSm: spacing[2], // 8px
} as const;

// Gap presets for flex containers
export const gap = {
  xs: spacing[1], // 4px
  sm: spacing[2], // 8px
  md: spacing[3], // 12px
  lg: spacing[4], // 16px
  xl: spacing[6], // 24px
} as const;

export type SpacingKey = keyof typeof spacing;
export type RadiusKey = keyof typeof radius;
export type ShadowKey = keyof typeof shadow;
