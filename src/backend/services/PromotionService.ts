import { supabase } from '@/lib/supabase/client'

export class PromotionService {
  async getActivePromotions() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'PAID')
      .gte('slotDate', today.toISOString())
      .lt('slotDate', tomorrow.toISOString())

    if (error) {
      throw new Error(`Failed to fetch active bookings: ${error.message}`)
    }

    const promotions = await Promise.all((bookings ?? []).map(async (booking) => {
      let imageUrl: string | null = null
      let name: string | null = null

      const { data: bandProfile } = await supabase.from('band_profiles').select('*').eq('userId', booking.userId).maybeSingle()
      if (bandProfile?.artistId) {
        const { data: artist } = await supabase.from('artists').select('name,imageUrl').eq('id', bandProfile.artistId).maybeSingle()
        imageUrl = artist?.imageUrl ?? null
        name = artist?.name ?? null
      } else {
        const { data: fanProfile } = await supabase.from('fan_profiles').select('nickname,avatarUrl').eq('userId', booking.userId).maybeSingle()
        if (fanProfile) {
          imageUrl = fanProfile.avatarUrl ?? null
          name = fanProfile.nickname
        } else {
          const { data: djProfile } = await supabase.from('dj_profiles').select('id').eq('userId', booking.userId).maybeSingle()
          if (djProfile) {
            name = 'DJ Promotion'
          }
        }
      }

      return {
        id: booking.id,
        type: booking.slotType,
        imageUrl,
        name,
        label: booking.slotType,
      }
    }))

    return promotions
  }
}

export const promotionService = new PromotionService()
