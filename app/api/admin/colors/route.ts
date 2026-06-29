import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getExtendedSettings, updateThemeConfig } from '@/lib/admin/settingsExtensions';
import { DEFAULT_THEME_CONFIG } from '@/config/defaultTheme';
import type { ThemeConfig } from '@/config/themeConfig';
import { ApiError } from '@/lib/errors';

export const GET = withAdminAuth(async () => {
  const supabase = createServiceRoleSupabaseClient();
  const { themeConfig } = await getExtendedSettings(supabase);
  return NextResponse.json({
    themeConfig,
    defaults: DEFAULT_THEME_CONFIG,
  });
});

export const POST = withAdminAuth(async (req, adminId) => {
  const body = await req.json();
  const { themeConfig } = body ?? {};
  if (!themeConfig?.colors || typeof themeConfig.colors !== 'object') {
    throw new ApiError(400, 'themeConfig.colors is required');
  }

  const next: ThemeConfig = {
    colors: {
      primary: themeConfig.colors.primary ?? DEFAULT_THEME_CONFIG.colors?.primary,
      secondary: themeConfig.colors.secondary ?? DEFAULT_THEME_CONFIG.colors?.secondary,
      background: themeConfig.colors.background ?? DEFAULT_THEME_CONFIG.colors?.background,
      foreground: themeConfig.colors.foreground ?? DEFAULT_THEME_CONFIG.colors?.foreground,
      card: themeConfig.colors.card ?? DEFAULT_THEME_CONFIG.colors?.card,
      muted: themeConfig.colors.muted ?? DEFAULT_THEME_CONFIG.colors?.muted,
      accent: themeConfig.colors.accent ?? DEFAULT_THEME_CONFIG.colors?.accent,
      border: themeConfig.colors.border ?? DEFAULT_THEME_CONFIG.colors?.border,
    },
  };

  const supabase = createServiceRoleSupabaseClient();
  await updateThemeConfig(supabase, next);

  await supabase.from('audit_logs').insert({
    adminId,
    action: 'UPDATE_THEME_COLORS',
    details: { colors: next.colors },
  });

  return NextResponse.json({ success: true, themeConfig: next });
});