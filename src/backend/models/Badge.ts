export type BadgeCategory = 'fan' | 'dj' | 'band';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  criteria: BadgeCriteria;
  isOneTime: boolean;
  createdAt: Date;
}

export interface BadgeCriteria {
  type: BadgeCriteriaType;
  parameters: Record<string, any>;
}

export type BadgeCriteriaType = 
  | 'voting_time'
  | 'consecutive_weeks'
  | 'genre_diversity'
  | 'early_supporter'
  | 'top_position_vote'
  | 'underdog_support'
  | 'vote_count'
  | 'trend_analyst'
  | 'pioneer'
  | 'curator'
  | 'first_vote'
  | 'sunday_ritual'
  | 'allrounder'
  | 'profile_visits'
  | 'low_follower_support'
  | 'weekly_active'
  | 'genre_hopper'
  | 'oracle'
  | 'golden_ear'
  | 'genre_focus'
  | 'expert_consecutive'
  | 'selector'
  | 'spotlight_maker'
  | 'taste_alignment'
  | 'rebel'
  | 'veteran'
  | 'legend'
  | 'precision'
  | 'quick_thinker'
  | 'world_traveler'
  | 'supporter'
  | 'elite'
  | 'trendsetter'
  | 'marathon'
  | 'archivist'
  | 'chart_breaker'
  | 'top_position'
  | 'chart_stability'
  | 'rapid_rise'
  | 'fan_magnet'
  | 'hot_streak'
  | 'comeback'
  | 'export_hit'
  | 'climber_of_week'
  | 'fan_favorite'
  | 'expert_pick'
  | 'productive'
  | 'complete_profile'
  | 'verified'
  | 'survivor'
  | 'viral'
  | 'monthly_best'
  | 'local_hero'
  | 'consistent'
  | 'hall_of_fame';

export interface EarnedBadge {
  id: string;
  badgeId: string;
  userId: string;
  earnedAt: Date;
  metadata?: Record<string, any>;
}

export interface CreateEarnedBadgeDTO {
  badgeId: string;
  userId: string;
  metadata?: Record<string, any>;
}
