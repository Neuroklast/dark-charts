import type { AppSupabaseClient } from '@/types/supabase-client'
import type { Database } from '@/types/database'

type UserRow = Database['public']['Tables']['users']['Row']
type FanProfileRow = Database['public']['Tables']['fan_profiles']['Row']
type DjProfileRow = Database['public']['Tables']['dj_profiles']['Row']
type BandProfileRow = Database['public']['Tables']['band_profiles']['Row']
type LabelProfileRow = Database['public']['Tables']['label_profiles']['Row']

export interface UserWithProfiles extends UserRow {
  fanProfile: FanProfileRow | null
  djProfile: DjProfileRow | null
  bandProfile: BandProfileRow | null
  labelProfile: LabelProfileRow | null
}

export async function getFanProfileByUserId(
  supabase: AppSupabaseClient,
  userId: string
): Promise<FanProfileRow | null> {
  const { data, error } = await supabase
    .from('fan_profiles')
    .select('*')
    .eq('userId', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch fan profile: ${error.message}`)
  }

  return data
}

export async function getDjProfileByUserId(
  supabase: AppSupabaseClient,
  userId: string
): Promise<DjProfileRow | null> {
  const { data, error } = await supabase
    .from('dj_profiles')
    .select('*')
    .eq('userId', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch DJ profile: ${error.message}`)
  }

  return data
}

export async function getUserWithProfiles(
  supabase: AppSupabaseClient,
  userId: string
): Promise<UserWithProfiles | null> {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    throw new Error(`Failed to fetch user: ${userError.message}`)
  }

  if (!user) {
    return null
  }

  const [fanProfile, djProfile, bandProfile, labelProfile] = await Promise.all([
    getFanProfileByUserId(supabase, userId),
    getDjProfileByUserId(supabase, userId),
    supabase
      .from('band_profiles')
      .select('*')
      .eq('userId', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          throw new Error(`Failed to fetch band profile: ${error.message}`)
        }
        return data
      }),
    supabase
      .from('label_profiles')
      .select('*')
      .eq('userId', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          throw new Error(`Failed to fetch label profile: ${error.message}`)
        }
        return data
      }),
  ])

  return {
    ...user,
    fanProfile,
    djProfile,
    bandProfile,
    labelProfile,
  }
}