import { IBadgeRepository } from './IBadgeRepository';
import { Badge, EarnedBadge, CreateEarnedBadgeDTO, BadgeCategory } from '../models/Badge';
import { BADGE_DEFINITIONS } from '../services/BadgeDefinitions';

export class SparkKVBadgeRepository implements IBadgeRepository {
  private readonly EARNED_BADGES_PREFIX = 'earned_badges:';
  
  async findAllBadges(): Promise<Badge[]> {
    return BADGE_DEFINITIONS;
  }

  async findBadgeById(badgeId: string): Promise<Badge | null> {
    const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);
    return badge || null;
  }

  async findBadgesByCategory(category: BadgeCategory): Promise<Badge[]> {
    return BADGE_DEFINITIONS.filter(b => b.category === category);
  }

  async findEarnedBadgesByUser(userId: string): Promise<EarnedBadge[]> {
    try {
      const key = `${this.EARNED_BADGES_PREFIX}${userId}`;
      const earnedBadges = await spark.kv.get<EarnedBadge[]>(key);
      return earnedBadges || [];
    } catch (error) {
      console.error(`Error fetching earned badges for user ${userId}:`, error);
      return [];
    }
  }

  async hasUserEarnedBadge(userId: string, badgeId: string): Promise<boolean> {
    const earnedBadges = await this.findEarnedBadgesByUser(userId);
    return earnedBadges.some(eb => eb.badgeId === badgeId);
  }

  async awardBadge(data: CreateEarnedBadgeDTO): Promise<EarnedBadge> {
    const key = `${this.EARNED_BADGES_PREFIX}${data.userId}`;
    const earnedBadges = await this.findEarnedBadgesByUser(data.userId);
    
    const alreadyEarned = earnedBadges.some(eb => eb.badgeId === data.badgeId);
    if (alreadyEarned) {
      throw new Error(`User ${data.userId} has already earned badge ${data.badgeId}`);
    }

    const newEarnedBadge: EarnedBadge = {
      id: `${data.userId}_${data.badgeId}_${Date.now()}`,
      badgeId: data.badgeId,
      userId: data.userId,
      earnedAt: new Date(),
      metadata: data.metadata
    };

    earnedBadges.push(newEarnedBadge);
    await spark.kv.set(key, earnedBadges);

    return newEarnedBadge;
  }

  async getEarnedBadgesCount(userId: string): Promise<number> {
    const earnedBadges = await this.findEarnedBadgesByUser(userId);
    return earnedBadges.length;
  }
}
