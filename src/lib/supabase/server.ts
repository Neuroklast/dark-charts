import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/errors';
import type { AppSupabaseClient } from '@/types/supabase-client';
import { isSupabaseServiceConfigured } from '@/lib/supabase/isConfigured';

export type ServiceRoleSupabaseClient = AppSupabaseClient;

export function tryCreateServiceRoleSupabaseClient(): AppSupabaseClient | null {
  if (!isSupabaseServiceConfigured()) return null;
  return createServiceRoleSupabaseClient();
}

export function createServiceRoleSupabaseClient(): AppSupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    '';

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!url || !serviceRoleKey) {
    throw new ApiError(
      503,
      'Supabase service role is not configured',
      'SERVICE_UNAVAILABLE'
    );
  }

  return createClient<any, 'public', any>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}