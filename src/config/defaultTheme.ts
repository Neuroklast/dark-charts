import type { ThemeConfig } from '@/config/themeConfig';

export const DEFAULT_THEME_COLORS: NonNullable<ThemeConfig['colors']> = {
  primary: '#493687',
  secondary: '#7e1e37',
  background: '#101010',
  foreground: '#f5f5f5',
  card: '#292929',
  muted: '#1a1a1a',
  accent: '#493687',
  border: '#333333',
};

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  colors: DEFAULT_THEME_COLORS,
};