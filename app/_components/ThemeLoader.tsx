import { ThemeStyleInjector } from './ThemeStyleInjector';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getExtendedSettings } from '@/lib/admin/settingsExtensions';
import { DEFAULT_THEME_CONFIG } from '@/config/defaultTheme';

export async function ThemeLoader() {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { themeConfig } = await getExtendedSettings(supabase);
    const hasCustom = Object.values(themeConfig.colors ?? {}).some(Boolean);
    return <ThemeStyleInjector themeConfig={hasCustom ? themeConfig : DEFAULT_THEME_CONFIG} />;
  } catch {
    return <ThemeStyleInjector themeConfig={DEFAULT_THEME_CONFIG} />;
  }
}