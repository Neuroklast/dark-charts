export interface ThemeEffects {
  overlay?: {
    chromaticAberration?: { enabled?: boolean; intensity?: number };
    colorWash?: { enabled?: boolean; color?: string; opacity?: number };
  };
}

export interface ThemeConfig {
  colors?: Record<string, string | undefined>;
  gradients?: Record<string, string | undefined>;
  typography?: Record<string, string | undefined>;
  glass?: { blur?: string; opacity?: string };
  animation?: { duration?: string };
  effects?: ThemeEffects & { customCss?: string };
}