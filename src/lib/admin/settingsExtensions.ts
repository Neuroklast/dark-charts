import type { Json } from '@/types/database';
import type { AppSupabaseClient } from '@/types/supabase-client';
import type { ThemeConfig } from '@/config/themeConfig';
import { DEFAULT_THEME_CONFIG } from '@/config/defaultTheme';
import { mergeFeatureFlags, type FeatureFlags } from '@/config/featureFlags';
import { GLOBAL_SETTINGS_ID } from '@/lib/api/systemSettings';

function parseJsonObject(value: Json | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function parseThemeConfig(value: Json | null | undefined): ThemeConfig {
  const raw = parseJsonObject(value);
  const colors = parseJsonObject(raw.colors as Json | undefined);
  return {
    colors: {
      primary: typeof colors.primary === 'string' ? colors.primary : DEFAULT_THEME_CONFIG.colors?.primary,
      secondary: typeof colors.secondary === 'string' ? colors.secondary : DEFAULT_THEME_CONFIG.colors?.secondary,
      background: typeof colors.background === 'string' ? colors.background : DEFAULT_THEME_CONFIG.colors?.background,
      foreground: typeof colors.foreground === 'string' ? colors.foreground : DEFAULT_THEME_CONFIG.colors?.foreground,
      card: typeof colors.card === 'string' ? colors.card : DEFAULT_THEME_CONFIG.colors?.card,
      muted: typeof colors.muted === 'string' ? colors.muted : DEFAULT_THEME_CONFIG.colors?.muted,
      accent: typeof colors.accent === 'string' ? colors.accent : DEFAULT_THEME_CONFIG.colors?.accent,
      border: typeof colors.border === 'string' ? colors.border : DEFAULT_THEME_CONFIG.colors?.border,
    },
  };
}

export async function getExtendedSettings(supabase: AppSupabaseClient) {
  const { data, error } = await supabase
    .from('system_settings')
    .select('featureFlags, themeConfig, isVotingPaused')
    .eq('id', GLOBAL_SETTINGS_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch extended settings: ${error.message}`);
  }

  return {
    featureFlags: mergeFeatureFlags(parseJsonObject(data?.featureFlags)),
    themeConfig: parseThemeConfig(data?.themeConfig),
    isVotingPaused: data?.isVotingPaused ?? false,
  };
}

export async function updateFeatureFlags(
  supabase: AppSupabaseClient,
  flags: Partial<FeatureFlags>
): Promise<FeatureFlags> {
  const current = await getExtendedSettings(supabase);
  const overrides: Record<string, unknown> = { ...current.featureFlags };
  for (const [key, value] of Object.entries(flags)) {
    if (typeof value === 'boolean') overrides[key] = value;
  }
  const next = mergeFeatureFlags(overrides);

  const { error } = await supabase
    .from('system_settings')
    .update({
      featureFlags: next,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', GLOBAL_SETTINGS_ID);

  if (error) throw new Error(error.message);
  return next;
}

export async function updateThemeConfig(
  supabase: AppSupabaseClient,
  themeConfig: ThemeConfig
): Promise<ThemeConfig> {
  const { error } = await supabase
    .from('system_settings')
    .update({
      themeConfig,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', GLOBAL_SETTINGS_ID);

  if (error) throw new Error(error.message);
  return themeConfig;
}