/**
 * Semantic color tokens inspired by shadcn/ui
 * Organized by purpose, not by color name
 */

export const colors = {
  light: {
    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    backgroundTertiary: '#F1F5F9',

    // Surfaces (cards, modals)
    surface: '#FFFFFF',
    surfaceHover: '#F8FAFC',
    surfaceActive: '#F1F5F9',

    // Borders
    border: '#E2E8F0',
    borderMuted: '#F1F5F9',
    borderFocus: '#1E40AF',

    // Text
    foreground: '#0F172A',
    foregroundMuted: '#64748B',
    foregroundSubtle: '#94A3B8',

    // Primary (Dark Blue)
    primary: '#1E40AF',
    primaryForeground: '#FFFFFF',
    primaryHover: '#1E3A8A',
    primaryMuted: '#DBEAFE',

    // Secondary
    secondary: '#F1F5F9',
    secondaryForeground: '#0F172A',
    secondaryHover: '#E2E8F0',

    // Accent
    accent: '#F1F5F9',
    accentForeground: '#0F172A',

    // Semantic
    success: '#10B981',
    successForeground: '#FFFFFF',
    successMuted: '#D1FAE5',

    warning: '#F59E0B',
    warningForeground: '#FFFFFF',
    warningMuted: '#FEF3C7',

    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    destructiveMuted: '#FEE2E2',

    info: '#3B82F6',
    infoForeground: '#FFFFFF',
    infoMuted: '#DBEAFE',

    // Financial specific
    income: '#10B981',
    incomeForeground: '#FFFFFF',
    incomeMuted: '#D1FAE5',

    expense: '#EF4444',
    expenseForeground: '#FFFFFF',
    expenseMuted: '#FEE2E2',

    investment: '#3B82F6',
    investmentForeground: '#FFFFFF',
    investmentMuted: '#DBEAFE',

    // Card specific
    card: '#FFFFFF',
    cardForeground: '#0F172A',

    // Muted
    muted: '#F1F5F9',
    mutedForeground: '#64748B',

    // Ring (focus indicator)
    ring: '#1E40AF',

    // Chart colors
    chart1: '#1E40AF',
    chart2: '#10B981',
    chart3: '#F59E0B',
    chart4: '#EF4444',
    chart5: '#3B82F6',
  },

  dark: {
    // Backgrounds
    background: '#09090B',
    backgroundSecondary: '#18181B',
    backgroundTertiary: '#27272A',

    // Surfaces (cards, modals)
    surface: '#18181B',
    surfaceHover: '#27272A',
    surfaceActive: '#3F3F46',

    // Borders
    border: '#27272A',
    borderMuted: '#18181B',
    borderFocus: '#A78BFA',

    // Text
    foreground: '#FAFAFA',
    foregroundMuted: '#A1A1AA',
    foregroundSubtle: '#71717A',

    // Primary (Purple - lighter for dark mode)
    primary: '#A78BFA',
    primaryForeground: '#09090B',
    primaryHover: '#8B5CF6',
    primaryMuted: '#2E1065',

    // Secondary
    secondary: '#27272A',
    secondaryForeground: '#FAFAFA',
    secondaryHover: '#3F3F46',

    // Accent
    accent: '#27272A',
    accentForeground: '#FAFAFA',

    // Semantic
    success: '#34D399',
    successForeground: '#09090B',
    successMuted: '#064E3B',

    warning: '#FBBF24',
    warningForeground: '#09090B',
    warningMuted: '#78350F',

    destructive: '#F87171',
    destructiveForeground: '#09090B',
    destructiveMuted: '#7F1D1D',

    info: '#60A5FA',
    infoForeground: '#09090B',
    infoMuted: '#1E3A8A',

    // Financial specific
    income: '#34D399',
    incomeForeground: '#09090B',
    incomeMuted: '#064E3B',

    expense: '#F87171',
    expenseForeground: '#09090B',
    expenseMuted: '#7F1D1D',

    investment: '#60A5FA',
    investmentForeground: '#09090B',
    investmentMuted: '#1E3A8A',

    // Card specific
    card: '#18181B',
    cardForeground: '#FAFAFA',

    // Muted
    muted: '#27272A',
    mutedForeground: '#A1A1AA',

    // Ring (focus indicator)
    ring: '#A78BFA',

    // Chart colors
    chart1: '#A78BFA',
    chart2: '#34D399',
    chart3: '#FBBF24',
    chart4: '#F87171',
    chart5: '#60A5FA',
  },
} as const;

// Category colors for charts and badges
export const categoryColors = [
  '#1E40AF', // Dark Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#84CC16', // Lime
] as const;

// Create a unified ColorScheme type that works for both light and dark
export interface ColorScheme {
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  border: string;
  borderMuted: string;
  borderFocus: string;
  foreground: string;
  foregroundMuted: string;
  foregroundSubtle: string;
  primary: string;
  primaryForeground: string;
  primaryHover: string;
  primaryMuted: string;
  secondary: string;
  secondaryForeground: string;
  secondaryHover: string;
  accent: string;
  accentForeground: string;
  success: string;
  successForeground: string;
  successMuted: string;
  warning: string;
  warningForeground: string;
  warningMuted: string;
  destructive: string;
  destructiveForeground: string;
  destructiveMuted: string;
  info: string;
  infoForeground: string;
  infoMuted: string;
  income: string;
  incomeForeground: string;
  incomeMuted: string;
  expense: string;
  expenseForeground: string;
  expenseMuted: string;
  investment: string;
  investmentForeground: string;
  investmentMuted: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export type ColorKey = keyof ColorScheme;
