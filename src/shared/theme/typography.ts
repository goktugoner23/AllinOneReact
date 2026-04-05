/**
 * Typography system — IBM Plex Sans, mirroring huginn-webapp's --font-sans.
 *
 * React Native does not auto-map fontWeight to custom font files. Each weight
 * must be referenced by its PostScript-ish family name (matches the TTF
 * filename minus extension after `npx react-native-asset` links the fonts).
 *
 * Use `getFontFamily(weight)` instead of raw `fontWeight` for any style that
 * should render in Plex Sans. textStyles below already do this for you.
 */

import { TextStyle } from 'react-native';

type FontWeightValue = '400' | '500' | '600' | '700';

// Raw family names (match src/assets/fonts/*.ttf).
export const fontFamily = {
  regular: 'IBMPlexSans-Regular',
  medium: 'IBMPlexSans-Medium',
  semibold: 'IBMPlexSans-SemiBold',
  bold: 'IBMPlexSans-Bold',
  // Mono sticks with system defaults — no Plex Mono bundled yet.
  mono: 'Menlo',
} as const;

export function getFontFamily(weight: FontWeightValue = '400'): string {
  switch (weight) {
    case '700':
      return fontFamily.bold;
    case '600':
      return fontFamily.semibold;
    case '500':
      return fontFamily.medium;
    case '400':
    default:
      return fontFamily.regular;
  }
}

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

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const letterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
} as const;

// Helper to build a text style with both fontWeight (for a11y / fallback) and
// the matching Plex family, so both engines resolve correctly.
function plex(
  weight: FontWeightValue,
  rest: Omit<TextStyle, 'fontFamily' | 'fontWeight'>
): TextStyle {
  return {
    fontFamily: getFontFamily(weight),
    fontWeight: weight,
    ...rest,
  };
}

export const textStyles = {
  // Headings
  h1: plex('600', { fontSize: 32, lineHeight: 40, letterSpacing: -0.5 }),
  h2: plex('600', { fontSize: 26, lineHeight: 34, letterSpacing: -0.3 }),
  h3: plex('600', { fontSize: 22, lineHeight: 30, letterSpacing: -0.2 }),
  h4: plex('600', { fontSize: 18, lineHeight: 26 }),

  subtitle: plex('500', { fontSize: 17, lineHeight: 26, letterSpacing: 0.1 }),

  // Body text
  body: plex('400', { fontSize: 15, lineHeight: 24 }),
  bodyLarge: plex('400', { fontSize: 17, lineHeight: 26 }),
  bodySmall: plex('400', { fontSize: 13, lineHeight: 20 }),

  // Caption and labels
  caption: plex('400', { fontSize: 12, lineHeight: 16 }),
  label: plex('500', { fontSize: 14, lineHeight: 20 }),
  labelSmall: plex('500', { fontSize: 12, lineHeight: 16 }),

  // Button text
  button: plex('500', { fontSize: 14, lineHeight: 20 }),
  buttonSmall: plex('500', { fontSize: 12, lineHeight: 16 }),
  buttonLarge: plex('500', { fontSize: 16, lineHeight: 24 }),

  // Monospace (for code, numbers) — system mono; Plex Mono not bundled.
  mono: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    fontFamily: fontFamily.mono,
  } as TextStyle,

  // Financial amounts (system mono)
  amount: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  } as TextStyle,
  amountLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600',
    fontFamily: fontFamily.mono,
  } as TextStyle,
  amountSmall: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    fontFamily: fontFamily.mono,
  } as TextStyle,
} as const;

export type TextStyleKey = keyof typeof textStyles;
