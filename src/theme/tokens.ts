export const palette = {
  paper: {
    50: '#FFFDF8',
    100: '#FAF7F0',
    200: '#F3EFE7',
    300: '#DED8CC',
    400: '#C8C0B2',
  },
  ink: {
    500: '#747067',
    600: '#6F6B62',
    900: '#282722',
  },
  powder: {
    100: '#E8EEF1',
    500: '#9CB4C5',
    600: '#526879',
    700: '#405666',
  },
  highlighter: {
    sage: '#DDE7D5',
    amber: '#F4E2AE',
    blue: '#DDE8EF',
  },
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    600: '#16A34A',
    700: '#15803D',
  },
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    600: '#D97706',
    700: '#B45309',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    600: '#DC2626',
    700: '#B91C1C',
  },
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radii = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

export const typography = {
  size: {
    caption: 12,
    label: 13,
    body: 14,
    bodyLarge: 16,
    title: 20,
    display: 30,
  },
  lineHeight: {
    caption: 16,
    label: 18,
    body: 20,
    bodyLarge: 22,
    title: 28,
    display: 38,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
  letterSpacing: {
    tight: -0.4,
    normal: 0,
    wide: 1.6,
  },
} as const;

export const sizes = {
  touchTarget: 44,
  contentMaxWidth: 720,
  bottomTabHeight: 72,
  screenPadding: 16,
  cardPadding: 16,
} as const;

export const motion = {
  duration: {
    fast: 150,
    normal: 220,
    slow: 320,
  },
} as const;
