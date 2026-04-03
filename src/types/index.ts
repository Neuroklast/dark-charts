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

export type ViewType = 'home' | 'main-genre' | 'sub-genre' | 'profile' | 'custom-charts' | 'about';

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

export interface IAuthService {
  getCurrentUser(): Promise<{ id: string; isAnonymous: boolean } | null>;
  ensureSession(): Promise<void>;
}
