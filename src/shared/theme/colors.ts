/**
 * Semantic color tokens mirroring huginn-webapp's shadcn theme.
 *
 * Values come from huginn-webapp/src/app/globals.css (oklch) converted to sRGB
 * hex — React Native cannot parse oklch().
 *
 * Keep in sync when the webapp palette changes.
 */

export const colors = {
  light: {
    // Warm off-white surfaces (webapp --background / --card)
    background: '#F8F7F2',
    backgroundSecondary: '#EFEEE9',
    backgroundTertiary: '#ECEAE5',

    surface: '#FEFEFC',
    surfaceHover: '#F3F2ED',
    surfaceActive: '#ECEAE5',

    // Borders / dividers (webapp --border)
    border: '#DFDED8',
    borderMuted: '#EBEAE4',
    borderFocus: '#1E232D',

    // Text (webapp --foreground / --muted-foreground)
    foreground: '#191B20',
    foregroundMuted: '#686C74',
    foregroundSubtle: '#8E929C',

    // Primary = near-black (webapp --primary)
    primary: '#1E232D',
    primaryForeground: '#FAFAF9',
    primaryHover: '#111319',
    primaryMuted: '#EFEEE9',

    secondary: '#EFEEE9',
    secondaryForeground: '#1E232D',
    secondaryHover: '#E4E2DB',

    accent: '#ECEAE5',
    accentForeground: '#1E232D',

    // Semantic — muted, gentle
    success: '#5F8967',
    successForeground: '#FFFFFF',
    successMuted: '#E4EDE2',

    warning: '#BC9C67',
    warningForeground: '#FFFFFF',
    warningMuted: '#F3EBDA',

    destructive: '#EA3036',
    destructiveForeground: '#FFFFFF',
    destructiveMuted: '#FBE0E1',

    info: '#7DADD7',
    infoForeground: '#FFFFFF',
    infoMuted: '#E3EDF7',

    // Financial
    income: '#5F8967',
    incomeForeground: '#FFFFFF',
    incomeMuted: '#E4EDE2',

    expense: '#EA3036',
    expenseForeground: '#FFFFFF',
    expenseMuted: '#FBE0E1',

    investment: '#7DADD7',
    investmentForeground: '#FFFFFF',
    investmentMuted: '#E3EDF7',

    card: '#FEFEFC',
    cardForeground: '#191B20',

    muted: '#EFEEE9',
    mutedForeground: '#686C74',

    ring: '#8E929C',

    // Chart palette (webapp --chart-1..5)
    chart1: '#7DADD7',
    chart2: '#6AA29A',
    chart3: '#5F8967',
    chart4: '#BC9C67',
    chart5: '#B06A65',

    // Modal scrim / backdrop (used behind fullscreen overlays)
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  dark: {
    // Deep cool surfaces (webapp dark --background / --card)
    background: '#0C0E13',
    backgroundSecondary: '#13161B',
    backgroundTertiary: '#1E2026',

    surface: '#13161B',
    surfaceHover: '#1E2026',
    surfaceActive: '#272A31',

    // Translucent-ish borders — flat hex approximation of rgba(255,255,255,0.1)
    border: '#262A31',
    borderMuted: '#1A1D23',
    borderFocus: '#ECEBE9',

    foreground: '#F1F0EE',
    foregroundMuted: '#9B9EA5',
    foregroundSubtle: '#828690',

    // Primary = near-white (webapp dark --primary)
    primary: '#ECEBE9',
    primaryForeground: '#0C0E13',
    primaryHover: '#FFFFFF',
    primaryMuted: '#1E2026',

    secondary: '#1E2026',
    secondaryForeground: '#F1F0EE',
    secondaryHover: '#272A31',

    accent: '#1E2026',
    accentForeground: '#F1F0EE',

    success: '#6AA98F',
    successForeground: '#0C0E13',
    successMuted: '#1A2A24',

    warning: '#D4B078',
    warningForeground: '#0C0E13',
    warningMuted: '#2B2318',

    destructive: '#EF5E61',
    destructiveForeground: '#0C0E13',
    destructiveMuted: '#2D1618',

    info: '#8FBDE2',
    infoForeground: '#0C0E13',
    infoMuted: '#172533',

    income: '#6AA98F',
    incomeForeground: '#0C0E13',
    incomeMuted: '#1A2A24',

    expense: '#EF5E61',
    expenseForeground: '#0C0E13',
    expenseMuted: '#2D1618',

    investment: '#8FBDE2',
    investmentForeground: '#0C0E13',
    investmentMuted: '#172533',

    card: '#13161B',
    cardForeground: '#F1F0EE',

    muted: '#1E2026',
    mutedForeground: '#9B9EA5',

    ring: '#828690',

    chart1: '#7DADD7',
    chart2: '#6AA29A',
    chart3: '#5F8967',
    chart4: '#BC9C67',
    chart5: '#B06A65',

    // Modal scrim / backdrop (used behind fullscreen overlays)
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

// Category colors for charts and badges — muted, harmonious
export const categoryColors = [
  '#7DADD7', // soft blue
  '#6AA29A', // teal
  '#5F8967', // sage
  '#BC9C67', // warm tan
  '#B06A65', // terracotta
  '#8E929C', // slate
  '#A584B5', // muted violet
  '#C78A6B', // clay
  '#7FA37F', // moss
  '#6F8AA8', // dusty blue
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
  overlay: string;
}

export type ColorKey = keyof ColorScheme;
