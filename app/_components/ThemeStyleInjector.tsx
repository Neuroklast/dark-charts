import type { ThemeConfig } from '@/config/themeConfig';

export interface ThemeStyleInjectorProps {
  themePrimary?: string;
  themeSecondary?: string;
  themeBackground?: string;
  themeForeground?: string;
  themeCard?: string;
  themeMuted?: string;
  themeAccent?: string;
  themeBorder?: string;
  themeConfig?: ThemeConfig;
}

type LegacyThemeKey = Exclude<keyof ThemeStyleInjectorProps, 'themeConfig'>;

const LEGACY_TOKEN_MAP: Array<[LegacyThemeKey, string]> = [
  ['themePrimary', '--primary'],
  ['themeSecondary', '--secondary'],
  ['themeBackground', '--background'],
  ['themeForeground', '--foreground'],
  ['themeCard', '--card'],
  ['themeMuted', '--muted'],
  ['themeAccent', '--accent'],
  ['themeBorder', '--border'],
];

function notEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

export function ThemeStyleInjector(props: ThemeStyleInjectorProps) {
  const { themeConfig, ...flat } = props;
  const declarations: string[] = [];

  if (themeConfig?.colors) {
    const colorMap: Record<string, string | undefined> = {
      '--primary': themeConfig.colors.primary,
      '--secondary': themeConfig.colors.secondary,
      '--background': themeConfig.colors.background,
      '--foreground': themeConfig.colors.foreground,
      '--card': themeConfig.colors.card,
      '--muted': themeConfig.colors.muted,
      '--accent': themeConfig.colors.accent,
      '--border': themeConfig.colors.border,
    };

    for (const [cssVar, value] of Object.entries(colorMap)) {
      if (notEmpty(value)) declarations.push(`  ${cssVar}: ${value};`);
    }
  } else {
    for (const [key, cssVar] of LEGACY_TOKEN_MAP) {
      const value = flat[key];
      if (notEmpty(value)) declarations.push(`  ${cssVar}: ${value};`);
    }
  }

  if (declarations.length === 0) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root {\n${declarations.join('\n')}\n}`,
      }}
    />
  );
}