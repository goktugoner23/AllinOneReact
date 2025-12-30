/**
 * Theme system exports
 * Inspired by shadcn/ui, adapted for React Native
 */

// Color tokens
export { colors, categoryColors, type ColorScheme, type ColorKey } from './colors';

// Typography system
export { fontFamily, fontSize, fontWeight, letterSpacing, textStyles, type TextStyleKey } from './typography';

// Spacing and sizing
export {
  spacing,
  radius,
  shadow,
  componentSizes,
  padding,
  gap,
  type SpacingKey,
  type RadiusKey,
  type ShadowKey,
} from './spacing';

// Theme context and hooks
export {
  ThemeProvider,
  useAppTheme,
  useColors,
  useIsDark,
  type ThemeMode,
  type ThemeContextValue,
} from './ThemeContext';
