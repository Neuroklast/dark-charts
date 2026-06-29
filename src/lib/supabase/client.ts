import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseEnvConfigured, readSupabasePublicEnv } from '@/lib/supabase/isConfigured'

let browserClient: SupabaseClient<any, 'public', any> | null = null

export function tryCreateBrowserSupabaseClient(): SupabaseClient<any, 'public', any> | null {
  if (!isSupabaseEnvConfigured()) {
    return null
  }

  if (!browserClient) {
    const { url: supabaseUrl, anonKey: supabaseAnonKey } = readSupabasePublicEnv()
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey) as SupabaseClient<
      any,
      'public',
      any
    >
  }

  return browserClient
}

export function createBrowserSupabaseClient(): SupabaseClient<any, 'public', any> {
  const client = tryCreateBrowserSupabaseClient()
  if (!client) {
    throw new Error(
      'Supabase client env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or legacy VITE_* vars during migration).'
    )
  }
  return client
}

export const supabase: SupabaseClient<any, 'public', any> = new Proxy(
  {} as SupabaseClient<any, 'public', any>,
  {
    get(_target, prop) {
      const client = createBrowserSupabaseClient()
      const value = (client as unknown as Record<string | symbol, unknown>)[prop]
      return typeof value === 'function'
        ? (value as (...args: unknown[]) => unknown).bind(client)
        : value
    },
  }
)