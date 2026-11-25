import '@/global.css';

import { Platform } from 'react-native';

/**
 * BTW mobile palette — parchment (light) / night (dark).
 * Sparse “calm fintech” structure; warm gold accent (not trading green).
 */
export const Colors = {
  light: {
    text: '#2B251C',
    textSecondary: '#6B604E',
    background: '#F8F4EA',
    card: '#FFFDF8',
    border: '#DDD0AA',
    muted: '#EFE8D8',
    primary: '#8A6514',
    onPrimary: '#FFFDF8',
    accent: '#8A6514',
    accentSoft: 'rgba(138, 101, 20, 0.12)',
    danger: '#B42318',
    success: '#2F7D4F',
  },
  dark: {
    text: '#F4EFE4',
    textSecondary: '#A89F8F',
    background: '#0F0E0C',
    card: '#1A1713',
    border: '#3A3328',
    muted: '#221E18',
    primary: '#E8C878',
    onPrimary: '#0F0E0C',
    accent: '#E8C878',
    accentSoft: 'rgba(232, 200, 120, 0.14)',
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
