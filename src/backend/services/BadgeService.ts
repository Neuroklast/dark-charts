import { IBadgeRepository } from '../repositories/IBadgeRepository';
import { IChartRepository } from '../repositories/IChartRepository';
import { Badge, EarnedBadge, BadgeCategory } from '../models/Badge';
import { ChartEntry } from '../models/ChartEntry';

interface BadgeEvaluationContext {
  userId: string;
  userType: BadgeCategory;
  chartHistory: ChartEntry[];
  votingHistory?: any[];
  profileData?: any;
  currentWeek: number;
  currentYear: number;
}

export class BadgeService {
  constructor(
    private badgeRepository: IBadgeRepository,
    private chartRepository: IChartRepository
  ) {}

  async evaluateAndAwardBadges(context: BadgeEvaluationContext): Promise<EarnedBadge[]> {
    const allBadges = await this.badgeRepository.findBadgesByCategory(context.userType);
    const awardedBadges: EarnedBadge[] = [];

    for (const badge of allBadges) {
      try {
        if (badge.isOneTime) {
          const alreadyEarned = await this.badgeRepository.hasUserEarnedBadge(
            context.userId,
            badge.id
          );
          if (alreadyEarned) {
            continue;
          }
        }

        const qualifies = await this.evaluateBadgeCriteria(badge, context);
        
        if (qualifies) {
          try {
            const earnedBadge = await this.badgeRepository.awardBadge({
              badgeId: badge.id,
              userId: context.userId,
              metadata: {
                awardedAtWeek: context.currentWeek,
                awardedAtYear: context.currentYear
              }
            });
            awardedBadges.push(earnedBadge);
          } catch (error) {
            if (error instanceof Error && error.message.includes('already earned')) {
              continue;
            }
            throw error;
          }
        }
      } catch (error) {
        console.error(`Error evaluating badge ${badge.id} for user ${context.userId}:`, error);
      }
    }

    return awardedBadges;
  }

  async getUserBadges(userId: string): Promise<{ badge: Badge; earnedAt: Date }[]> {
    const earnedBadges = await this.badgeRepository.findEarnedBadgesByUser(userId);
    const allBadges = await this.badgeRepository.findAllBadges();

    const badgesWithDetails = earnedBadges
      .map(earned => {
        const badge = allBadges.find(b => b.id === earned.badgeId);
        if (!badge) return null;
        return {
          badge,
          earnedAt: earned.earnedAt
        };
      })
      .filter((item): item is { badge: Badge; earnedAt: Date } => item !== null);

    return badgesWithDetails.sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime());
  }

  async triggerWeeklyBadgeEvaluation(weekNumber: number, year: number): Promise<void> {
    console.log(`Starting weekly badge evaluation for week ${weekNumber}/${year}`);
    
    try {
      const fanCharts = await this.chartRepository.findByChartType('fan', weekNumber, year);
      const expertCharts = await this.chartRepository.findByChartType('expert', weekNumber, year);
      const streamingCharts = await this.chartRepository.findByChartType('streaming', weekNumber, year);

      const allEntries = [...fanCharts, ...expertCharts, ...streamingCharts];
      const uniqueArtistIds = [...new Set(allEntries.map(entry => entry.artistId))];

      console.log(`Evaluating badges for ${uniqueArtistIds.length} artists`);

      for (const artistId of uniqueArtistIds) {
        await this.evaluateArtistBadges(artistId, weekNumber, year);
      }

      console.log('Weekly badge evaluation completed');
    } catch (error) {
      console.error('Error during weekly badge evaluation:', error);
      throw error;
    }
  }

  private async evaluateArtistBadges(
    artistId: string,
    weekNumber: number,
    year: number
  ): Promise<void> {
    try {
      const artistHistory = await this.chartRepository.findByArtistId(artistId);

      const context: BadgeEvaluationContext = {
        userId: artistId,
        userType: 'band',
        chartHistory: artistHistory,
        currentWeek: weekNumber,
        currentYear: year
      };

      await this.evaluateAndAwardBadges(context);
    } catch (error) {
      console.error(`Error evaluating badges for artist ${artistId}:`, error);
    }
  }

  private async evaluateBadgeCriteria(
    badge: Badge,
    context: BadgeEvaluationContext
  ): Promise<boolean> {
    const { chartHistory } = context;
    const params = badge.criteria.parameters;

    switch (badge.criteria.type) {
      case 'chart_breaker':
        return this.evaluateChartBreaker(chartHistory, params);
      
      case 'top_position':
        return this.evaluateTopPosition(chartHistory, params);
      
      case 'chart_stability':
        return this.evaluateChartStability(chartHistory, params);
      
      case 'rapid_rise':
        return this.evaluateRapidRise(chartHistory, params);
      
      case 'hot_streak':
        return this.evaluateHotStreak(chartHistory, params);
      
      case 'comeback':
        return this.evaluateComeback(chartHistory, params);
      
      case 'consistent':
        return this.evaluateConsistency(chartHistory, params);
      
      case 'hall_of_fame':
        return this.evaluateHallOfFame(chartHistory, params);
      
      case 'vote_count':
        return this.evaluateVoteCount(chartHistory, params);
      
      case 'viral':
        return this.evaluateViral(chartHistory, params);

      default:
        return false;
    }
  }

  private evaluateChartBreaker(history: ChartEntry[], params: any): boolean {
    const topPosition = params.position || 10;
    return history.some(entry => entry.position <= topPosition);
  }

  private evaluateTopPosition(history: ChartEntry[], params: any): boolean {
    const targetPosition = params.position || 1;
    return history.some(entry => entry.position === targetPosition);
  }

  private evaluateChartStability(history: ChartEntry[], params: any): boolean {
    const requiredWeeks = params.weeks || 10;
    
    if (history.length < requiredWeeks) return false;

    const recentHistory = history.slice(0, requiredWeeks);
    return recentHistory.every(entry => entry.position > 0);
  }

  private evaluateRapidRise(history: ChartEntry[], params: any): boolean {
    const minRise = params.positions || 20;
    
    return history.some((entry, index) => {
      if (index === 0) return false;
      const previousEntry = history[index - 1];
      if (!entry.previousPosition || !previousEntry.position) return false;
      
      const rise = entry.previousPosition - entry.position;
      return rise >= minRise;
    });
  }

  private evaluateHotStreak(history: ChartEntry[], params: any): boolean {
    const requiredWeeks = params.weeks || 3;
    const topPosition = params.position || 5;
    
    if (history.length < requiredWeeks) return false;

    const recentHistory = history.slice(0, requiredWeeks);
    return recentHistory.every(entry => entry.position <= topPosition);
  }

  private evaluateComeback(history: ChartEntry[], params: any): boolean {
    const pauseWeeks = params.pauseWeeks || 4;
    
    for (let i = 0; i < history.length - pauseWeeks; i++) {
      const current = history[i];
      const afterPause = history[i + pauseWeeks];
      
      if (!current || !afterPause) continue;
      
      let hasGap = true;
      for (let j = i + 1; j < i + pauseWeeks; j++) {
        if (history[j]?.position > 0) {
          hasGap = false;
          break;
        }
      }
      
      if (hasGap && current.position > 0 && afterPause.position > 0) {
        return true;
      }
    }
    
    return false;
  }

  private evaluateConsistency(history: ChartEntry[], params: any): boolean {
    const requiredWeeks = params.weeks || 5;
    const maxChange = params.maxChange || 2;
    
    if (history.length < requiredWeeks) return false;

    const recentHistory = history.slice(0, requiredWeeks);
    
    for (let i = 0; i < recentHistory.length - 1; i++) {
      const current = recentHistory[i];
      const next = recentHistory[i + 1];
      
      const change = Math.abs(current.position - next.position);
      if (change > maxChange) {
        return false;
      }
    }
    
    return true;
  }

  private evaluateHallOfFame(history: ChartEntry[], params: any): boolean {
    const requiredCount = params.count || 3;
    const topPositions = history.filter(entry => entry.position === 1);
    return topPositions.length >= requiredCount;
  }

  private evaluateVoteCount(history: ChartEntry[], params: any): boolean {
    const requiredVotes = params.count || 10;
    const totalVotes = history.reduce((sum, entry) => sum + (entry.votes || 0), 0);
    return totalVotes >= requiredVotes;
  }

  private evaluateViral(history: ChartEntry[], params: any): boolean {
    const requiredVotes = params.votes || 1000;
    return history.some(entry => (entry.votes || 0) >= requiredVotes);
  }
}
