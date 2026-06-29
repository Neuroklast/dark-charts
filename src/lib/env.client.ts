import { z } from 'zod'

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SPOTIFY_CLIENT_ID: z.string().min(1).optional().default(''),
})

function readClientEnv() {
  const meta =
    typeof import.meta !== 'undefined'
      ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
      : undefined

  return {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      meta?.NEXT_PUBLIC_SUPABASE_URL ??
      meta?.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      meta?.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      meta?.VITE_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID:
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ??
      meta?.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ??
      meta?.VITE_SPOTIFY_CLIENT_ID,
  }
}

function parseClientEnv() {
  const result = clientEnvSchema.safeParse(readClientEnv())

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid client environment: ${formatted}`)
  }

  return result.data
}

let cachedClientEnv: z.infer<typeof clientEnvSchema> | null = null

export function getClientEnv() {
  if (!cachedClientEnv) {
    cachedClientEnv = parseClientEnv()
  }
  return cachedClientEnv
}

export const clientEnv = new Proxy({} as z.infer<typeof clientEnvSchema>, {
  get(_target, prop) {
    return getClientEnv()[prop as keyof z.infer<typeof clientEnvSchema>]
  },
})