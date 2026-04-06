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
    // Page-level background (webapp bg-[#efede7])
    background: '#efede7',
    backgroundSecondary: '#EFEEE9',
    backgroundTertiary: '#ECEAE5',

    // Sidebar background (webapp bg-[#f4f1ea])
    sidebar: '#f4f1ea',

    surface: '#FEFEFC',
    surfaceHover: '#F3F2ED',
    surfaceActive: '#ECEAE5',

    // Borders / dividers (webapp border-black/6)
    border: 'rgba(0,0,0,0.06)',
    borderMuted: '#EBEAE4',
    borderFocus: '#1E232D',

    // Text (webapp --foreground / --muted-foreground)
    foreground: '#191B20',
    foregroundMuted: '#686C74',
    foregroundSubtle: '#8E929C',

    // Primary = near-black (webapp --primary / bg-neutral-900)
    primary: '#171717',
    primaryForeground: '#FFFFFF',
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

    // Card (webapp bg-white/90 in sidebar header, #faf6ee general)
    card: '#faf6ee',
    cardForeground: '#191B20',
    cardIconBg: '#f2ede3',

    // Header (webapp bg-white/85 backdrop-blur)
    headerBg: 'rgba(255,255,255,0.85)',
    headerBorder: 'rgba(0,0,0,0.06)',

    // Currency/action pill bg (webapp bg-[#f5f2eb])
    pillBg: '#f5f2eb',

    muted: '#EFEEE9',
    mutedForeground: '#686C74',

    ring: '#8E929C',

    // Chart palette (webapp --chart-1..5)
    chart1: '#7DADD7',
    chart2: '#6AA29A',
    chart3: '#5F8967',
    chart4: '#BC9C67',
    chart5: '#B06A65',

    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  dark: {
    // Page-level background (webapp dark:bg-[#0b0d10])
    background: '#0b0d10',
    backgroundSecondary: '#13161B',
    backgroundTertiary: '#1E2026',

    // Sidebar background (webapp dark:bg-[#0f1114])
    sidebar: '#0f1114',

    surface: '#151920',
    surfaceHover: '#1E2026',
    surfaceActive: '#272A31',

    // Borders (webapp dark:border-white/10)
    border: 'rgba(255,255,255,0.1)',
    borderMuted: '#1A1D23',
    borderFocus: '#ECEBE9',

    foreground: '#F1F0EE',
    foregroundMuted: '#9B9EA5',
    foregroundSubtle: '#828690',

    // Primary = near-white (webapp dark:bg-white / dark:text-neutral-950)
    primary: '#FFFFFF',
    primaryForeground: '#0a0a0a',
    primaryHover: '#e5e5e5',
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

    // Card (webapp dark surface)
    card: '#151920',
    cardForeground: '#F1F0EE',
    cardIconBg: '#171b21',

    // Header (webapp dark:bg-[#0f1114]/88)
    headerBg: 'rgba(15,17,20,0.88)',
    headerBorder: 'rgba(255,255,255,0.1)',

    // Currency/action pill bg (webapp dark:bg-white/5)
    pillBg: 'rgba(255,255,255,0.05)',

    muted: '#1E2026',
    mutedForeground: '#9B9EA5',

    ring: '#828690',

    chart1: '#7DADD7',
    chart2: '#6AA29A',
    chart3: '#5F8967',
    chart4: '#BC9C67',
    chart5: '#B06A65',

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
  sidebar: string;
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
  cardIconBg: string;
  headerBg: string;
  headerBorder: string;
  pillBg: string;
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
