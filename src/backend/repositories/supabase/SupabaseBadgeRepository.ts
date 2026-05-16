import { supabase } from '@/lib/supabase/client'
import { Badge, BadgeCategory, CreateEarnedBadgeDTO, EarnedBadge } from '../../models/Badge'
import { IBadgeRepository } from '../IBadgeRepository'
import { BADGE_DEFINITIONS } from '../../services/BadgeDefinitions'

const toEarnedBadge = (row: any): EarnedBadge => ({
  id: row.id,
  userId: row.userId,
  badgeId: row.badgeId,
  earnedAt: new Date(row.earnedAt),
})

export class SupabaseBadgeRepository implements IBadgeRepository {
  async findAllBadges(): Promise<Badge[]> {
    return BADGE_DEFINITIONS
  }

  async findBadgeById(badgeId: string): Promise<Badge | null> {
    return BADGE_DEFINITIONS.find((badge) => badge.id === badgeId) ?? null
  }

  async findBadgesByCategory(category: BadgeCategory): Promise<Badge[]> {
    return BADGE_DEFINITIONS.filter((badge) => badge.category === category)
  }

  async findEarnedBadgesByUser(userId: string): Promise<EarnedBadge[]> {
    const { data, error } = await supabase.from('user_badges').select('*').eq('userId', userId)
    if (error) {
      throw new Error(`Failed to fetch earned badges by user: ${error.message}`)
    }
    return (data ?? []).map(toEarnedBadge)
  }

  async hasUserEarnedBadge(userId: string, badgeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_badges')
      .select('id')
      .eq('userId', userId)
      .eq('badgeId', badgeId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to check earned badge: ${error.message}`)
    }

    return Boolean(data)
  }

  async awardBadge(data: CreateEarnedBadgeDTO): Promise<EarnedBadge> {
    const payload = {
      userId: data.userId,
      badgeId: data.badgeId,
      earnedAt: new Date().toISOString(),
    }

    const { data: created, error } = await supabase.from('user_badges').insert(payload).select().single()
    if (error) {
      throw new Error(`Failed to award badge: ${error.message}`)
    }

    return toEarnedBadge(created)
  }

  async getEarnedBadgesCount(userId: string): Promise<number> {
    const earned = await this.findEarnedBadgesByUser(userId)
    return earned.length
  }
}
