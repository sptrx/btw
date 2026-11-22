import '@/global.css';

import { Platform } from 'react-native';

/** Matches the website's parchment (light) and night (dark) palettes in app/globals.css. */
export const Colors = {
  light: {
    text: '#2B251C',
    textSecondary: '#6B604E',
    background: '#F8F4EA',
    card: '#FFFDF8',
    border: '#E2D8C2',
    muted: '#EFE8D8',
    primary: '#3D3222',
    onPrimary: '#FFFDF8',
    accent: '#B8892E',
    danger: '#B42318',
    success: '#2F7D4F',
  },
  dark: {
    text: '#F4EFE4',
    textSecondary: '#B5AB98',
    background: '#1C1812',
    card: '#27221B',
    border: '#3A3328',
    muted: '#322B22',
    primary: '#E8C878',
    onPrimary: '#1C1812',
    accent: '#E8C878',
    danger: '#F97066',
    success: '#6CCB91',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', mono: 'ui-monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', mono: 'var(--font-mono)' },
  default: { sans: 'normal', serif: 'serif', mono: 'monospace' },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const MaxContentWidth = 720;
