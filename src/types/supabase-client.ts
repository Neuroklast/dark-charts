import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Hand-written Database types lack Supabase codegen Relationships, which makes
 * strict `.insert()` / `.update()` infer `never`. Use this alias in DAL code.
 */
export type AppSupabaseClient = SupabaseClient