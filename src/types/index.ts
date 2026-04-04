export type MainGenre = 'Gothic' | 'Metal' | 'Dark Electro' | 'Crossover';

export type Genre = 
  | 'Gothic Rock' | 'Dark Wave' | 'Post Punk' | 'Deathrock' | 'Cold Wave' 
  | 'Ethereal Wave' | 'Neoklassik' | 'Neue Deutsche Todeskunst' | 'Batcave' 
  | 'Neofolk' | 'Pagan Folk' | 'Nordic Folk' | 'Ritual Ambient'
  | 'Gothic Metal' | 'Dark Metal' | 'Symphonic Metal' | 'Doom Metal' 
  | 'Symphonic Black Metal' | 'Atmospheric Black Metal' | 'Death Doom' | 'Pagan Metal'
  | 'Electronic Body Music' | 'Dark Electro' | 'Electro Industrial' | 'Aggrotech' 
  | 'Future Pop' | 'Industrial' | 'Rhythmic Noise' | 'Dark Synthpop' | 'Harsh EBM'
  | 'Industrial Metal' | 'Neue Deutsche Härte' | 'Mittelalter Rock' | 'Darksynth' 
  | 'Cybergoth' | 'Death Industrial' | 'Folk Metal' | 'Dark Techno' 
  | 'Industrial Techno' | 'Darkstep' | 'Crossbreed' | 'Techstep' | 'Neurofunk';

export type ChartType = 'fan' | 'expert' | 'streaming' | 'overall';

export type ViewType = 'home' | 'main-genre' | 'sub-genre' | 'profile' | 'custom-charts' | 'about' | 'voting' | 'history' | 'admin' | 'oauth-callback' | 'profiles-demo';

export interface Track {
  id: string;
  rank: number;
  artist: string;
  title: string;
  genres: Genre[];
  movement?: number;
  previousRank?: number;
  chartType: ChartType;
  fanScore?: number;
  expertScore?: number;
  streamingScore?: number;
  albumArt?: string;
  spotifyUri?: string;
  votes?: number;
  weeksInChart?: number;
  album?: string;
  releaseDate?: string;
  label?: string;
  appleMusicUrl?: string;
  amazonMusicUrl?: string;
  youtubeUrl?: string;
  overallRank?: number;
  subGenreRanks?: Record<Genre, number>;
  previewUrl?: string;
  isrc?: string;
  artworkHighRes?: string;
  odesliData?: OdesliData;
  community_power?: number;
  trend_direction?: 'up' | 'down' | 'stable' | 'new';
}

export interface OdesliData {
  id: string;
  entityUniqueId: string;
  userCountry: string;
  pageUrl: string;
  linksByPlatform: {
    [key: string]: {
      url: string;
      nativeAppUriMobile?: string;
      nativeAppUriDesktop?: string;
    };
  };
  entitiesByUniqueId: {
    [key: string]: {
      id: string;
      type: string;
      title?: string;
      artistName?: string;
      thumbnailUrl?: string;
      thumbnailWidth?: number;
      thumbnailHeight?: number;
      apiProvider: string;
      platforms: string[];
    };
  };
}

export interface CachedTrackData {
  trackId: string;
  odesliData?: OdesliData;
  artworkUrl?: string;
  previewUrl?: string;
  lastUpdated: number;
}

export interface ApiThrottleState {
  requestCount: number;
  windowStart: number;
  queue: Array<() => Promise<void>>;
}

export interface ChartWeights {
  fan: number;
  expert: number;
  streaming: number;
}

export interface ChartData {
  fanCharts: Track[];
  expertCharts: Track[];
  streamingCharts: Track[];
}

export interface Vote {
  trackId: string;
  credits: number;
  timestamp: number;
}

export interface IDataService {
  getAllCharts(): Promise<ChartData>;
  getChartByType(type: 'fan' | 'expert' | 'streaming'): Promise<Track[]>;
  calculateOverallChart(weights: ChartWeights): Track[];
  vote(trackId: string, credits: number): Promise<void>;
  getVotes(trackId: string): Promise<number>;
  getUserVotesForTrack(trackId: string): Promise<number>;
  getNextChartPublicationDate(): Date;
}

export type UserType = 'fan' | 'band' | 'dj' | 'label';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: number;
}

export interface ExternalLink {
  platform: string;
  url: string;
  verified: boolean;
}

export interface BaseUserProfile {
  id: string;
  userType: UserType;
  username: string;
  biography?: string;
  avatarUrl?: string;
  externalLinks: ExternalLink[];
  displayedBadges: string[];
  allBadges: Badge[];
  createdAt: number;
  updatedAt: number;
}

export interface FanProfile extends BaseUserProfile {
  userType: 'fan';
  votingCredits: number;
  votingHistory: Vote[];
  favoritesList: string[];
  personalCharts: string[];
  curatedCharts: CuratedChart[];
  followingIds: string[];
  followerIds: string[];
  engagementStats?: {
    votingStreak: number;
    genreAffinity: Record<Genre, number>;
    totalVotesLifetime: number;
    weeklyActivity: number;
  };
  schemaOrgData?: SchemaOrgPerson;
}

export interface BandProfile extends BaseUserProfile {
  userType: 'band';
  genres: Genre[];
  spotifyArtistId?: string;
  latestReleases: {
    title: string;
    releaseDate: number;
    spotifyUri?: string;
  }[];
  isPremium: boolean;
  analytics?: {
    totalVotes: number;
    chartPositions: { chartType: ChartType; position: number }[];
    demographics: Record<string, number>;
  };
  bookingInfo?: {
    available: boolean;
    regions: string[];
    contactEmail?: string;
  };
  followerIds: string[];
  topSupporters?: {
    userId: string;
    username: string;
    avatarUrl?: string;
    voteCount: number;
  }[];
  upcomingEvents?: MusicEvent[];
  mediaGallery?: {
    url: string;
    type: 'image' | 'video';
    caption?: string;
  }[];
  schemaOrgData?: SchemaOrgMusicGroup;
}

export interface DJProfile extends BaseUserProfile {
  userType: 'dj';
  expertWeight: number;
  references: string[];
  curatedPlaylists: {
    name: string;
    trackIds: string[];
    createdAt: number;
  }[];
  supportedTracks: string[];
  reputation: number;
  followerIds: string[];
  followingIds: string[];
  predictivePower?: {
    correctPredictions: number;
    totalPredictions: number;
    accuracy: number;
  };
  curatedCharts: CuratedChart[];
  schemaOrgData?: SchemaOrgPerson;
}

export interface LabelProfile extends BaseUserProfile {
  userType: 'label';
  managedBands: string[];
  aggregatedAnalytics?: {
    totalVotes: number;
    totalStreams: number;
    topBands: { bandId: string; performance: number }[];
  };
  scoutingNotes: {
    bandId: string;
    note: string;
    timestamp: number;
  }[];
}

export type UserProfile = FanProfile | BandProfile | DJProfile | LabelProfile;

export interface AuthUser {
  id: string;
  email?: string;
  provider?: 'spotify' | 'apple' | 'mock';
  isAuthenticated: boolean;
  profile?: UserProfile;
}

export interface IAuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  login(provider: 'spotify' | 'apple' | 'mock'): Promise<AuthUser>;
  logout(): Promise<void>;
  updateProfile(profile: Partial<UserProfile>): Promise<UserProfile>;
}

export interface ChartSnapshot {
  week: number;
  date: number;
  fanCharts: Track[];
  expertCharts: Track[];
  streamingCharts: Track[];
}

export interface TrackHistory {
  trackId: string;
  artist: string;
  title: string;
  history: {
    week: number;
    date: number;
    rank: number;
    chartType: ChartType;
    movement: number;
  }[];
}

export interface WeeklyMovement {
  week: number;
  date: number;
  movers: {
    biggest: Track[];
    risers: Track[];
    fallers: Track[];
    newEntries: Track[];
    reEntries: Track[];
  };
}

export interface Artist {
  id: string;
  name: string;
  spotifyId?: string;
  appleMusicId?: string;
  genres: Genre[];
  artwork?: string;
  bio?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Release {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  releaseDate: string;
  albumArt?: string;
  spotifyUri?: string;
  appleMusicUrl?: string;
  type: 'album' | 'single' | 'ep';
  tracks?: ReleaseTrack[];
  createdAt: number;
  lastCached: number;
}

export interface ReleaseTrack {
  id: string;
  title: string;
  duration: number;
  trackNumber: number;
  spotifyUri?: string;
  previewUrl?: string;
}

export interface ArtistCacheStatus {
  artistId: string;
  lastSync: number;
  nextSync: number;
  releaseCount: number;
  status: 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

export interface CuratedChart {
  id: string;
  userId: string;
  title: string;
  description?: string;
  trackIds: string[];
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  followerCount: number;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: number;
}

export interface MusicEvent {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  location: {
    name: string;
    address?: string;
    city?: string;
    country?: string;
  };
  url?: string;
  description?: string;
}

export interface SchemaOrgPerson {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  image?: string;
  description?: string;
  url?: string;
  sameAs?: string[];
}

export interface SchemaOrgMusicGroup {
  '@context': 'https://schema.org';
  '@type': 'MusicGroup';
  name: string;
  image?: string;
  description?: string;
  genre?: string[];
  url?: string;
  sameAs?: string[];
  member?: string[];
  event?: MusicEvent[];
}

export interface ActivityFeedItem {
  id: string;
  type: 'follow' | 'chart_created' | 'milestone' | 'prediction' | 'badge_earned';
  userId: string;
  username: string;
  avatarUrl?: string;
  timestamp: number;
  data: Record<string, any>;
}
