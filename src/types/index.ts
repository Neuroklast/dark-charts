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

export type ViewType = 'home' | 'main-genre' | 'sub-genre' | 'profile' | 'custom-charts' | 'about' | 'voting';

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
  direction: 'up' | 'down';
  timestamp: number;
}

export interface IDataService {
  getAllCharts(): Promise<ChartData>;
  getChartByType(type: 'fan' | 'expert' | 'streaming'): Promise<Track[]>;
  calculateOverallChart(weights: ChartWeights): Track[];
  vote(trackId: string, direction: 'up' | 'down'): Promise<void>;
  getVotes(trackId: string): Promise<number>;
  hasUserVoted(trackId: string): Promise<boolean>;
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
