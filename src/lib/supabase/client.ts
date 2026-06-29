import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clientEnv } from '@/lib/env.client'

function readLegacyViteEnv(): { url: string; anonKey: string } | null {
  const meta =
    typeof import.meta !== 'undefined'
      ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
      : undefined

  const url = meta?.VITE_SUPABASE_URL
  const anonKey = meta?.VITE_SUPABASE_ANON_KEY

  if (url && anonKey) {
    return { url, anonKey }
  }

  return null
}

function resolveBrowserSupabaseConfig(): { url: string; anonKey: string } {
  try {
    return {
      url: clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  } catch {
    const legacy = readLegacyViteEnv()
    if (legacy) {
      return legacy
    }
    throw new Error(
      'Supabase client env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or legacy VITE_* vars during migration).'
    )
  }
}

let browserClient: SupabaseClient<any, 'public', any> | null = null

export function createBrowserSupabaseClient(): SupabaseClient<any, 'public', any> {
  if (!browserClient) {
    const { url: supabaseUrl, anonKey: supabaseAnonKey } =
      resolveBrowserSupabaseConfig()
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey) as SupabaseClient<
      any,
      'public',
      any
    >
  }
  return browserClient
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