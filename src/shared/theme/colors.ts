/**
 * Semantic color tokens inspired by shadcn/ui
 * Organized by purpose, not by color name
 */

export const colors = {
  light: {
    // Backgrounds - warmer, softer whites (Soft Minimal)
    background: '#FAFBFC',
    backgroundSecondary: '#F5F7F9',
    backgroundTertiary: '#EEF1F4',

    // Surfaces (cards, modals)
    surface: '#FFFFFF',
    surfaceHover: '#F7F9FB',
    surfaceActive: '#EFF2F5',

    // Borders - softer, less harsh
    border: '#E5E9EF',
    borderMuted: '#F0F3F6',
    borderFocus: '#6366F1',

    // Text - slightly warmer
    foreground: '#1A1F2E',
    foregroundMuted: '#6B7280',
    foregroundSubtle: '#9CA3AF',

    // Primary - refined indigo (Soft Minimal)
    primary: '#6366F1',
    primaryForeground: '#FFFFFF',
    primaryHover: '#4F46E5',
    primaryMuted: '#EEF2FF',

    // Secondary
    secondary: '#F1F5F9',
    secondaryForeground: '#1A1F2E',
    secondaryHover: '#E2E8F0',

    // Accent
    accent: '#F1F5F9',
    accentForeground: '#1A1F2E',

    // Semantic - muted, gentle
    success: '#059669',
    successForeground: '#FFFFFF',
    successMuted: '#D1FAE5',

    warning: '#D97706',
    warningForeground: '#FFFFFF',
    warningMuted: '#FEF3C7',

    destructive: '#DC2626',
    destructiveForeground: '#FFFFFF',
    destructiveMuted: '#FEE2E2',

    info: '#0284C7',
    infoForeground: '#FFFFFF',
    infoMuted: '#E0F2FE',

    // Financial specific - softer tones
    income: '#059669',
    incomeForeground: '#FFFFFF',
    incomeMuted: '#D1FAE5',

    expense: '#DC2626',
    expenseForeground: '#FFFFFF',
    expenseMuted: '#FEE2E2',

    investment: '#3B82F6',
    investmentForeground: '#FFFFFF',
    investmentMuted: '#DBEAFE',

    // Card specific
    card: '#FFFFFF',
    cardForeground: '#1A1F2E',

    // Muted
    muted: '#F1F5F9',
    mutedForeground: '#6B7280',

    // Ring (focus indicator)
    ring: '#6366F1',

    // Chart colors - harmonious indigo palette
    chart1: '#6366F1',
    chart2: '#059669',
    chart3: '#D97706',
    chart4: '#DC2626',
    chart5: '#3B82F6',
  },

  dark: {
    // Backgrounds - deep, restful (Zen Depth)
    background: '#0C0D10',
    backgroundSecondary: '#141519',
    backgroundTertiary: '#1E2028',

    // Surfaces (cards, modals)
    surface: '#16171C',
    surfaceHover: '#1E2028',
    surfaceActive: '#282B35',

    // Borders - subtle separation
    border: '#2A2D38',
    borderMuted: '#1E2028',
    borderFocus: '#818CF8',

    // Text - comfortable contrast
    foreground: '#F3F4F6',
    foregroundMuted: '#9CA3AF',
    foregroundSubtle: '#6B7280',

    // Primary - luminous indigo (Soft Minimal dark)
    primary: '#818CF8',
    primaryForeground: '#0C0D10',
    primaryHover: '#6366F1',
    primaryMuted: '#1E1B4B',

    // Secondary
    secondary: '#1E2028',
    secondaryForeground: '#F3F4F6',
    secondaryHover: '#282B35',

    // Accent
    accent: '#1E2028',
    accentForeground: '#F3F4F6',

    // Semantic
    success: '#34D399',
    successForeground: '#0C0D10',
    successMuted: '#064E3B',

    warning: '#FBBF24',
    warningForeground: '#0C0D10',
    warningMuted: '#78350F',

    destructive: '#F87171',
    destructiveForeground: '#0C0D10',
    destructiveMuted: '#7F1D1D',

    info: '#38BDF8',
    infoForeground: '#0C0D10',
    infoMuted: '#0C4A6E',

    // Financial specific
    income: '#34D399',
    incomeForeground: '#0C0D10',
    incomeMuted: '#064E3B',

    expense: '#F87171',
    expenseForeground: '#0C0D10',
    expenseMuted: '#7F1D1D',

    investment: '#60A5FA',
    investmentForeground: '#0C0D10',
    investmentMuted: '#1E3A8A',

    // Card specific
    card: '#16171C',
    cardForeground: '#F3F4F6',

    // Muted
    muted: '#1E2028',
    mutedForeground: '#9CA3AF',

    // Ring (focus indicator)
    ring: '#818CF8',

    // Chart colors
    chart1: '#818CF8',
    chart2: '#34D399',
    chart3: '#FBBF24',
    chart4: '#F87171',
    chart5: '#60A5FA',
  },
} as const;

// Category colors for charts and badges (Soft Minimal palette)
export const categoryColors = [
  '#6366F1', // Indigo (primary)
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#3B82F6', // Blue
  '#DB2777', // Pink
  '#0891B2', // Cyan
  '#7C3AED', // Violet
  '#EA580C', // Orange
  '#65A30D', // Lime
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
