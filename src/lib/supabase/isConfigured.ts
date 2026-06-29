function readLegacyViteEnv(): { url?: string; anonKey?: string } {
  const meta =
    typeof import.meta !== 'undefined'
      ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
      : undefined;

  return {
    url: meta?.VITE_SUPABASE_URL,
    anonKey: meta?.VITE_SUPABASE_ANON_KEY,
  };
}

export function readSupabasePublicEnv(): { url: string; anonKey: string } {
  const legacy = readLegacyViteEnv();

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    legacy.url ??
    '';

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    legacy.anonKey ??
    '';

  return { url, anonKey };
}

export function isSupabaseEnvConfigured(): boolean {
  const { url, anonKey } = readSupabasePublicEnv();
  return Boolean(url && anonKey && !url.includes('your-project'));
}

export function isSupabaseServiceConfigured(): boolean {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return Boolean(url && serviceRoleKey && !url.includes('your-project'));
}