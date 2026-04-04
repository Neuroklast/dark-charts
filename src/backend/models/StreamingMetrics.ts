export interface StreamingMetrics {
  artistId: string;
  artistName: string;
  totalStreams: number;
  followerCount: number;
  weeklyGrowthPercentage: number;
  previousWeekStreams: number;
}

export interface StreamingScore {
  artistId: string;
  score: number;
  logarithmicScore: number;
  growthFactor: number;
  engagementRatio: number;
}

export interface StreamingChartResult {
  artistId: string;
  artistName: string;
  position: number;
  score: number;
  totalStreams: number;
  followerCount: number;
  weeklyGrowth: number;
  engagementRatio: number;
}
