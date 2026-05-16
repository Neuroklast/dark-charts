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

    const userIds = (bookings ?? []).map((b) => b.userId)

    const [bandResult, fanResult, djResult] = await Promise.all([
      supabase.from('band_profiles').select('userId,artistId').in('userId', userIds),
      supabase.from('fan_profiles').select('userId,nickname,avatarUrl').in('userId', userIds),
      supabase.from('dj_profiles').select('userId').in('userId', userIds),
    ])

    const bandByUser = new Map((bandResult.data ?? []).map((p) => [p.userId, p]))
    const fanByUser = new Map((fanResult.data ?? []).map((p) => [p.userId, p]))
    const djUserSet = new Set((djResult.data ?? []).map((p) => p.userId))

    const artistIds = [...new Set(
      [...bandByUser.values()].map((p) => p.artistId).filter(Boolean)
    )]

    const artistsResult = artistIds.length > 0
      ? await supabase.from('artists').select('id,name,imageUrl').in('id', artistIds)
      : { data: [] }

    const artistById = new Map((artistsResult.data ?? []).map((a) => [a.id, a]))

    const promotions = (bookings ?? []).map((booking) => {
      let imageUrl: string | null = null
      let name: string | null = null

      const band = bandByUser.get(booking.userId)
      if (band?.artistId) {
        const artist = artistById.get(band.artistId)
        imageUrl = artist?.imageUrl ?? null
        name = artist?.name ?? null
      } else {
        const fan = fanByUser.get(booking.userId)
        if (fan) {
          imageUrl = fan.avatarUrl ?? null
          name = fan.nickname
        } else if (djUserSet.has(booking.userId)) {
          name = 'DJ Promotion'
        }
      }

      return {
        id: booking.id,
        type: booking.slotType,
        imageUrl,
        name,
        label: booking.slotType,
      }
    })

    return promotions
  }
}

export const promotionService = new PromotionService()
