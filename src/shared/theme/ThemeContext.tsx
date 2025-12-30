/**
 * Theme context provider with hook-based access
 * Integrates with React Native Paper while providing shadcn-inspired tokens
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, ColorScheme } from './colors';
import { textStyles } from './typography';
import { spacing, radius, shadow, padding, gap, componentSizes } from './spacing';

// Theme mode type
export type ThemeMode = 'light' | 'dark' | 'system';

// Theme context interface
export interface ThemeContextValue {
  // Current colors based on mode
  colors: ColorScheme;
  // Typography styles
  textStyles: typeof textStyles;
  // Spacing and sizing
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: typeof shadow;
  padding: typeof padding;
  gap: typeof gap;
  componentSizes: typeof componentSizes;
  // Theme state
  mode: ThemeMode;
  isDark: boolean;
  // Actions
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

// Storage key
const THEME_STORAGE_KEY = '@app_theme_mode';

// Create context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Provider props
interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}

/**
 * Theme provider component
 */
export function ThemeProvider({ children, initialMode = 'system' }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          setModeState(saved as ThemeMode);
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  // Determine if dark mode should be active
  const isDark = useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, systemColorScheme]);

  // Get current color scheme
  const currentColors = useMemo(() => {
    return isDark ? colors.dark : colors.light;
  }, [isDark]);

  // Set mode and persist
  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.warn('Failed to save theme mode:', error);
    }
  }, []);

  // Toggle between light and dark (skips system)
  const toggleTheme = useCallback(() => {
    setMode(isDark ? 'light' : 'dark');
  }, [isDark, setMode]);

  // Context value
  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: currentColors,
      textStyles,
      spacing,
      radius,
      shadow,
      padding,
      gap,
      componentSizes,
      mode,
      isDark,
      setMode,
      toggleTheme,
    }),
    [currentColors, mode, isDark, setMode, toggleTheme],
  );

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access theme context
 */
export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to get just the colors (convenience)
 */
export function useColors(): ColorScheme {
  const { colors } = useAppTheme();
  return colors;
}

/**
 * Hook to check dark mode status
 */
export function useIsDark(): boolean {
  const { isDark } = useAppTheme();
  return isDark;
}

export default ThemeProvider;
