import { Badge, EarnedBadge, CreateEarnedBadgeDTO, BadgeCategory } from '../models/Badge';

export interface IBadgeRepository {
  findAllBadges(): Promise<Badge[]>;
  
  findBadgeById(badgeId: string): Promise<Badge | null>;
  
  findBadgesByCategory(category: BadgeCategory): Promise<Badge[]>;
  
  findEarnedBadgesByUser(userId: string): Promise<EarnedBadge[]>;
  
  hasUserEarnedBadge(userId: string, badgeId: string): Promise<boolean>;
  
  awardBadge(data: CreateEarnedBadgeDTO): Promise<EarnedBadge>;
  
  getEarnedBadgesCount(userId: string): Promise<number>;
}
