import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getExtendedSettings } from '@/lib/admin/settingsExtensions';
import { DEFAULT_THEME_CONFIG } from '@/config/defaultTheme';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { themeConfig } = await getExtendedSettings(supabase);
    const hasCustom = Object.values(themeConfig.colors ?? {}).some(Boolean);
    return NextResponse.json({
      themeConfig: hasCustom ? themeConfig : DEFAULT_THEME_CONFIG,
    });
  } catch {
    return NextResponse.json({ themeConfig: DEFAULT_THEME_CONFIG });
  }
}