/**
 * Shared theme types used across the application
 */

// Theme mode
export type ThemeMode = 'light' | 'dark' | 'system';

// Color palette
export interface ColorPalette {
  primary: string;
  primaryVariant: string;
  secondary: string;
  secondaryVariant: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  divider: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  disabled: string;
  placeholder: string;
}

// Theme configuration
export interface Theme {
  mode: ThemeMode;
  colors: ColorPalette;
  spacing: SpacingScale;
  typography: Typography;
  borderRadius: BorderRadiusScale;
  shadows: ShadowScale;
  elevation: ElevationScale;
}

// Spacing scale
export interface SpacingScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

// Typography configuration
export interface Typography {
  fontFamily: {
    regular: string;
    medium: string;
    bold: string;
    light: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
    title: number;
    largeTitle: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  fontWeight: {
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}

// Border radius scale
export interface BorderRadiusScale {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

// Shadow configuration
export interface ShadowScale {
  none: ShadowStyle;
  sm: ShadowStyle;
  md: ShadowStyle;
  lg: ShadowStyle;
  xl: ShadowStyle;
}

// Shadow style
export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: {
    width: number;
    height: number;
  };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number; // Android
}

// Elevation scale (React Native Paper)
export interface ElevationScale {
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
}

// Component theme variants
export interface ComponentTheme {
  button: ButtonTheme;
  card: CardTheme;
  input: InputTheme;
  modal: ModalTheme;
}

// Button theme
export interface ButtonTheme {
  primary: ButtonVariant;
  secondary: ButtonVariant;
  outline: ButtonVariant;
  ghost: ButtonVariant;
  danger: ButtonVariant;
}

// Button variant
export interface ButtonVariant {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  disabledBackgroundColor: string;
  disabledTextColor: string;
}

// Card theme
export interface CardTheme {
  backgroundColor: string;
  borderColor: string;
  shadowColor: string;
  borderRadius: number;
  padding: number;
}

// Input theme
export interface InputTheme {
  backgroundColor: string;
  borderColor: string;
  focusedBorderColor: string;
  errorBorderColor: string;
  textColor: string;
  placeholderColor: string;
  borderRadius: number;
  padding: number;
}

// Modal theme
export interface ModalTheme {
  backgroundColor: string;
  overlayColor: string;
  borderRadius: number;
  padding: number;
}

// Theme context type
export interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

// Theme provider props
export interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: ThemeMode;
}

// Responsive breakpoints
export interface Breakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

// Media query helpers
export interface MediaQueries {
  up: (breakpoint: keyof Breakpoints) => string;
  down: (breakpoint: keyof Breakpoints) => string;
  between: (start: keyof Breakpoints, end: keyof Breakpoints) => string;
  only: (breakpoint: keyof Breakpoints) => string;
}