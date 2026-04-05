import { useState, useEffect, useMemo, useCallback } from 'react';
import { Track, ChartWeights, ChartType, Genre, ViewType, MainGenre } from '@/types';
import { ChartCategory } from '@/components/ChartCategory';
import { ChartEntry } from '@/components/ChartEntry';
import { Card } from '@/components/ui/card';
import { Skull } from '@phosphor-icons/react';
import { MusicPlayer } from '@/components/MusicPlayer';
import { TopNavigation } from '@/components/TopNavigation';
import { GenreCharts } from '@/components/GenreCharts';
import { ProfileView } from '@/components/ProfileView';
import { AboutView } from '@/components/AboutView';
import { CustomChartsView } from '@/components/CustomChartsView';
import { VotingArea } from '@/components/VotingArea';
import { ChartHistoryView } from '@/components/ChartHistoryView';
import { PillarNavigation } from '@/components/PillarNavigation';
import { MainGenreNavigation } from '@/components/MainGenreNavigation';
import { SubGenreNavigation } from '@/components/SubGenreNavigation';
import { TrackDetailModal } from '@/components/TrackDetailModal';
import { OAuthCallback } from '@/components/OAuthCallback';
import { useKV } from '@github/spark/hooks';
import { DataProvider, useDataService } from '@/contexts/DataContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { Toaster } from '@/components/ui/sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminArtistManagement } from '@/components/AdminArtistManagement';
import { ArtistDatabaseManager } from '@/components/ArtistDatabaseManager';
import { trackEnrichmentService } from '@/services/trackEnrichmentService';
import { nightlySyncService } from '@/services/nightlySyncService';
import { useUpcomingTrackPreloader, useVisibleTracksPreloader } from '@/hooks/use-artwork-cache';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { safeFilter, safeSlice, safeFindIndex, isNullOrUndefined } from '@/lib/safe-utils';
import { ChartEntrySkeleton } from '@/components/skeletons';
import { ProfilesDemo } from '@/components/ProfilesDemo';
import { PrivacyPolicyView } from '@/components/PrivacyPolicyView';
import { TermsOfServiceView } from '@/components/TermsOfServiceView';
import { ImprintView } from '@/components/ImprintView';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';

function AppContent() {
  const dataService = useDataService();
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [currentMainGenre, setCurrentMainGenre] = useState<MainGenre | 'overall'>('overall');
  const [currentSubGenre, setCurrentSubGenre] = useState<Genre | null>(null);
  const [activePillar, setActivePillar] = useState<ChartType | 'overview'>('overview');
  const [fanCharts, setFanCharts] = useState<Track[]>([]);
  const [expertCharts, setExpertCharts] = useState<Track[]>([]);
  const [streamingCharts, setStreamingCharts] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTrackForModal, setSelectedTrackForModal] = useState<Track | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [weights, setWeights] = useKV<ChartWeights>('chart-weights', {
    fan: 33,
    expert: 33,
    streaming: 34
  });

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (window.location.pathname === '/oauth/callback') {
        setCurrentView('oauth-callback');
      }
    } catch (error) {
      console.error('Error checking URL parameters:', error);
    }
  }, []);

  useEffect(() => {
    const loadCharts = async () => {
      setIsLoading(true);
      try {
        if (!dataService) {
          throw new Error('DataService not available');
        }

        const data = await dataService.getAllCharts();
        
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data received from service');
        }

        const allTracks = [
          ...(Array.isArray(data.fanCharts) ? data.fanCharts : []),
          ...(Array.isArray(data.expertCharts) ? data.expertCharts : []),
          ...(Array.isArray(data.streamingCharts) ? data.streamingCharts : [])
        ];
        
        if (trackEnrichmentService && allTracks.length > 0) {
          try {
            const enrichedTracks = await trackEnrichmentService.enrichTracks(allTracks);
            const enrichedMap = new Map(enrichedTracks.map(t => [t.id, t]));
            
            const enrichedFanCharts = (data.fanCharts || []).map(t => enrichedMap.get(t.id) || t);
            const enrichedExpertCharts = (data.expertCharts || []).map(t => enrichedMap.get(t.id) || t);
            const enrichedStreamingCharts = (data.streamingCharts || []).map(t => enrichedMap.get(t.id) || t);
            
            setFanCharts(enrichedFanCharts);
            setExpertCharts(enrichedExpertCharts);
            setStreamingCharts(enrichedStreamingCharts);
            
            if (enrichedFanCharts.length > 0) {
              setCurrentTrack(enrichedFanCharts[0]);
            }
            
            trackEnrichmentService.startBackgroundSync(allTracks);
          } catch (enrichmentError) {
            console.error('Failed to enrich tracks:', enrichmentError);
            setFanCharts(Array.isArray(data.fanCharts) ? data.fanCharts : []);
            setExpertCharts(Array.isArray(data.expertCharts) ? data.expertCharts : []);
            setStreamingCharts(Array.isArray(data.streamingCharts) ? data.streamingCharts : []);
            
            if (Array.isArray(data.fanCharts) && data.fanCharts.length > 0) {
              setCurrentTrack(data.fanCharts[0]);
            }
          }
        } else {
          setFanCharts(Array.isArray(data.fanCharts) ? data.fanCharts : []);
          setExpertCharts(Array.isArray(data.expertCharts) ? data.expertCharts : []);
          setStreamingCharts(Array.isArray(data.streamingCharts) ? data.streamingCharts : []);
          
          if (Array.isArray(data.fanCharts) && data.fanCharts.length > 0) {
            setCurrentTrack(data.fanCharts[0]);
          }
        }
        
        if (nightlySyncService) {
          try {
            nightlySyncService.initialize();
          } catch (syncError) {
            console.error('Failed to initialize nightly sync:', syncError);
          }
        }
      } catch (error) {
        console.error('Failed to load charts:', error);
        setFanCharts([]);
        setExpertCharts([]);
        setStreamingCharts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharts();
  }, [dataService]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const allTracks = [...fanCharts, ...expertCharts, ...streamingCharts];
        if (allTracks.length > 0 && trackEnrichmentService) {
          const enrichedTracks = await trackEnrichmentService.enrichTracks(allTracks);
          const enrichedMap = new Map(enrichedTracks.map(t => [t.id, t]));
          
          setFanCharts(current => current.map(t => enrichedMap.get(t.id) || t));
          setExpertCharts(current => current.map(t => enrichedMap.get(t.id) || t));
          setStreamingCharts(current => current.map(t => enrichedMap.get(t.id) || t));
        }
      } catch (error) {
        console.error('Failed to sync tracks:', error);
      }
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fanCharts, expertCharts, streamingCharts]);

  const allGenres: Genre[] = useMemo(() => {
    try {
      const genreSet = new Set<Genre>();
      const allTracks = [...fanCharts, ...expertCharts, ...streamingCharts];
      
      allTracks.forEach(track => {
        if (track && Array.isArray(track.genres)) {
          track.genres.forEach(genre => {
            if (genre) {
              genreSet.add(genre);
            }
          });
        }
      });
      
      return Array.from(genreSet).sort();
    } catch (error) {
      console.error('Error computing all genres:', error);
      return [];
    }
  }, [fanCharts, expertCharts, streamingCharts]);

  const filterByGenre = useCallback((tracks: Track[]): Track[] => {
    try {
      if (!Array.isArray(tracks)) {
        return [];
      }
      
      if (!Array.isArray(selectedGenres) || selectedGenres.length === 0) {
        return tracks;
      }
      
      return safeFilter(tracks, (track) => {
        if (!track || !Array.isArray(track.genres)) {
          return false;
        }
        return track.genres.some(genre => selectedGenres.includes(genre));
      });
    } catch (error) {
      console.error('Error filtering by genre:', error);
      return tracks;
    }
  }, [selectedGenres]);

  const filteredFanCharts = useMemo(() => {
    try {
      return safeSlice(filterByGenre(fanCharts), 0, 10, []);
    } catch (error) {
      console.error('Error filtering fan charts:', error);
      return [];
    }
  }, [fanCharts, filterByGenre]);

  const filteredExpertCharts = useMemo(() => {
    try {
      return safeSlice(filterByGenre(expertCharts), 0, 10, []);
    } catch (error) {
      console.error('Error filtering expert charts:', error);
      return [];
    }
  }, [expertCharts, filterByGenre]);

  const filteredStreamingCharts = useMemo(() => {
    try {
      return safeSlice(filterByGenre(streamingCharts), 0, 10, []);
    } catch (error) {
      console.error('Error filtering streaming charts:', error);
      return [];
    }
  }, [streamingCharts, filterByGenre]);

  const overallChart = useMemo(() => {
    try {
      if (!Array.isArray(fanCharts) || fanCharts.length === 0 ||
          !Array.isArray(expertCharts) || expertCharts.length === 0 ||
          !Array.isArray(streamingCharts) || streamingCharts.length === 0 ||
          !weights) {
        return [];
      }
      
      if (!dataService || typeof dataService.calculateOverallChart !== 'function') {
        return [];
      }
      
      const chart = dataService.calculateOverallChart(weights);
      return safeSlice(filterByGenre(chart), 0, 10, []);
    } catch (error) {
      console.error('Error calculating overall chart:', error);
      return [];
    }
  }, [weights, fanCharts, expertCharts, streamingCharts, dataService, filterByGenre]);

  const currentVisibleTracks = useMemo(() => {
    try {
      if (currentView === 'home') {
        if (activePillar === 'overview') {
          return [
            ...safeSlice(filteredFanCharts, 0, 3, []),
            ...safeSlice(filteredExpertCharts, 0, 3, []),
            ...safeSlice(filteredStreamingCharts, 0, 3, [])
          ];
        } else if (activePillar === 'fan') {
          return filteredFanCharts;
        } else if (activePillar === 'expert') {
          return filteredExpertCharts;
        } else if (activePillar === 'streaming') {
          return filteredStreamingCharts;
        }
      }
      return [];
    } catch (error) {
      console.error('Error computing visible tracks:', error);
      return [];
    }
  }, [currentView, activePillar, filteredFanCharts, filteredExpertCharts, filteredStreamingCharts]);

  const allTracksForPlayer = useMemo(() => {
    try {
      if (activePillar === 'overview') {
        return overallChart;
      } else if (activePillar === 'fan') {
        return filteredFanCharts;
      } else if (activePillar === 'expert') {
        return filteredExpertCharts;
      } else if (activePillar === 'streaming') {
        return filteredStreamingCharts;
      }
      return [...fanCharts, ...expertCharts, ...streamingCharts];
    } catch (error) {
      console.error('Error computing player tracks:', error);
      return [];
    }
  }, [activePillar, overallChart, filteredFanCharts, filteredExpertCharts, filteredStreamingCharts, fanCharts, expertCharts, streamingCharts]);

  useUpcomingTrackPreloader(currentTrack, allTracksForPlayer, 5);
  useVisibleTracksPreloader(currentVisibleTracks, 10);

  const handleWeightsChange = useCallback((newWeights: ChartWeights) => {
    try {
      if (!newWeights || typeof newWeights !== 'object') {
        console.error('Invalid weights object');
        return;
      }
      setWeights(newWeights);
    } catch (error) {
      console.error('Error updating weights:', error);
    }
  }, [setWeights]);

  const handleTrackClick = useCallback(async (track: Track) => {
    try {
      if (!track) {
        console.warn('Invalid track object');
        return;
      }

      let enrichedTrack = track;
      if (trackEnrichmentService && typeof trackEnrichmentService.enrichTrack === 'function') {
        try {
          enrichedTrack = await trackEnrichmentService.enrichTrack(track);
        } catch (enrichmentError) {
          console.error('Failed to enrich track:', enrichmentError);
        }
      }

      setSelectedTrackForModal(enrichedTrack);
      setIsModalOpen(true);
      setCurrentTrack(enrichedTrack);
    } catch (error) {
      console.error('Error handling track click:', error);
    }
  }, []);

  const handleToggleGenre = useCallback((genre: Genre) => {
    try {
      if (!genre) {
        console.warn('Invalid genre');
        return;
      }

      setSelectedGenres(current => {
        try {
          if (!Array.isArray(current)) {
            return [genre];
          }
          
          if (current.includes(genre)) {
            return safeFilter(current, g => g !== genre);
          }
          return [...current, genre];
        } catch (error) {
          console.error('Error toggling genre:', error);
          return current;
        }
      });
    } catch (error) {
      console.error('Error in handleToggleGenre:', error);
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    try {
      setSelectedGenres([]);
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  }, []);

  const getAllChartPositions = useCallback((track: Track) => {
    try {
      if (!track) {
        return [];
      }

      const positions: { chartName: string; position: number; chartType?: ChartType; mainGenre?: MainGenre; subGenre?: Genre }[] = [];
      
      const fanIndex = safeFindIndex(fanCharts, t => t?.id === track.id, -1);
      if (fanIndex !== -1 && fanIndex < 10) {
        positions.push({ chartName: 'Fan Charts', position: fanIndex + 1, chartType: 'fan' });
      }
      
      const expertIndex = safeFindIndex(expertCharts, t => t?.id === track.id, -1);
      if (expertIndex !== -1 && expertIndex < 10) {
        positions.push({ chartName: 'Expert Charts', position: expertIndex + 1, chartType: 'expert' });
      }
      
      const streamingIndex = safeFindIndex(streamingCharts, t => t?.id === track.id, -1);
      if (streamingIndex !== -1 && streamingIndex < 10) {
        positions.push({ chartName: 'Streaming Charts', position: streamingIndex + 1, chartType: 'streaming' });
      }
      
      const overallIndex = safeFindIndex(overallChart, t => t?.id === track.id, -1);
      if (overallIndex !== -1) {
        positions.push({ chartName: 'Overall Charts', position: overallIndex + 1 });
      }

      const mainGenreMap: Record<MainGenre, Genre[]> = {
        'Gothic': [
          'Gothic Rock', 'Dark Wave', 'Post Punk', 'Deathrock', 'Cold Wave',
          'Ethereal Wave', 'Neoklassik', 'Neue Deutsche Todeskunst', 'Batcave',
          'Neofolk', 'Pagan Folk', 'Nordic Folk', 'Ritual Ambient'
        ],
        'Metal': [
          'Gothic Metal', 'Dark Metal', 'Symphonic Metal', 'Doom Metal',
          'Symphonic Black Metal', 'Atmospheric Black Metal', 'Death Doom', 'Pagan Metal'
        ],
        'Dark Electro': [
          'Electronic Body Music', 'Dark Electro', 'Electro Industrial', 'Aggrotech',
          'Future Pop', 'Industrial', 'Rhythmic Noise', 'Dark Synthpop', 'Harsh EBM'
        ],
        'Crossover': [
          'Industrial Metal', 'Neue Deutsche Härte', 'Mittelalter Rock', 'Darksynth',
          'Cybergoth', 'Death Industrial', 'Folk Metal', 'Dark Techno',
          'Industrial Techno', 'Darkstep', 'Crossbreed', 'Techstep', 'Neurofunk'
        ]
      };

      try {
        Object.entries(mainGenreMap).forEach(([mainGenre, subGenres]) => {
          const mainGenreTracks = safeFilter(
            [...fanCharts, ...expertCharts, ...streamingCharts],
            t => t && Array.isArray(t.genres) && t.genres.some(g => subGenres.includes(g))
          );
          
          const mainGenreIndex = safeFindIndex(mainGenreTracks, t => t?.id === track.id, -1);
          if (mainGenreIndex !== -1 && mainGenreIndex < 10) {
            positions.push({
              chartName: `${mainGenre} Charts`,
              position: mainGenreIndex + 1,
              mainGenre: mainGenre as MainGenre
            });
          }

          if (track.genres && Array.isArray(track.genres)) {
            track.genres.forEach(genre => {
              if (subGenres.includes(genre)) {
                const subGenreTracks = safeFilter(mainGenreTracks, t => t?.genres?.includes(genre));
                const subGenreIndex = safeFindIndex(subGenreTracks, t => t?.id === track.id, -1);
                if (subGenreIndex !== -1 && subGenreIndex < 10) {
                  positions.push({
                    chartName: `${genre}`,
                    position: subGenreIndex + 1,
                    mainGenre: mainGenre as MainGenre,
                    subGenre: genre
                  });
                }
              }
            });
          }
        });
      } catch (error) {
        console.error('Error computing genre chart positions:', error);
      }

      return positions;
    } catch (error) {
      console.error('Error getting all chart positions:', error);
      return [];
    }
  }, [fanCharts, expertCharts, streamingCharts, overallChart]);

  const handleNavigateToChart = useCallback((chartType?: ChartType, mainGenre?: MainGenre, subGenre?: Genre) => {
    try {
      if (mainGenre) {
        setCurrentView('main-genre');
        setCurrentMainGenre(mainGenre);
        if (subGenre) {
          setCurrentSubGenre(subGenre);
        } else {
          setCurrentSubGenre(null);
        }
      } else if (chartType) {
        setCurrentView('home');
        setCurrentMainGenre('overall');
        setCurrentSubGenre(null);
        setActivePillar(chartType === 'overall' ? 'overview' : chartType);
      }
    } catch (error) {
      console.error('Error navigating to chart:', error);
    }
  }, []);

  const handleNext = useCallback(() => {
    try {
      if (!currentTrack) return;
      
      const allTracks = activePillar === 'overview' ? overallChart : 
                        activePillar === 'fan' ? filteredFanCharts : 
                        activePillar === 'expert' ? filteredExpertCharts : 
                        filteredStreamingCharts;
      
      if (!Array.isArray(allTracks) || allTracks.length === 0) return;
      
      const currentIndex = safeFindIndex(allTracks, t => t?.id === currentTrack.id, -1);
      if (currentIndex < allTracks.length - 1) {
        setCurrentTrack(allTracks[currentIndex + 1]);
      }
    } catch (error) {
      console.error('Error navigating to next track:', error);
    }
  }, [currentTrack, activePillar, filteredFanCharts, filteredExpertCharts, filteredStreamingCharts, overallChart]);

  const handlePrevious = useCallback(() => {
    try {
      if (!currentTrack) return;
      
      const allTracks = activePillar === 'overview' ? overallChart : 
                        activePillar === 'fan' ? filteredFanCharts : 
                        activePillar === 'expert' ? filteredExpertCharts : 
                        filteredStreamingCharts;
      
      if (!Array.isArray(allTracks) || allTracks.length === 0) return;
      
      const currentIndex = safeFindIndex(allTracks, t => t?.id === currentTrack.id, -1);
      if (currentIndex > 0) {
        setCurrentTrack(allTracks[currentIndex - 1]);
      }
    } catch (error) {
      console.error('Error navigating to previous track:', error);
    }
  }, [currentTrack, activePillar, filteredFanCharts, filteredExpertCharts, filteredStreamingCharts, overallChart]);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden pb-32">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:font-ui focus:text-sm focus:uppercase focus:tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Skip to main content
      </a>
      {currentView === 'oauth-callback' ? (
        <ErrorBoundary level="component">
          <OAuthCallback />
        </ErrorBoundary>
      ) : (
        <>
          <Toaster position="top-right" />
          
          <div className="cyber-crt-overlay" />
          
          <svg className="fixed inset-0 w-full h-full pointer-events-none z-[2] opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
              <feColorMatrix type="saturate" values="0"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)"/>
          </svg>

          <ErrorBoundary level="component">
            <TopNavigation
              currentView={currentView} 
              onNavigate={(view: ViewType) => {
                try {
                  setCurrentView(view);
                  if (view === 'home') {
                    setCurrentMainGenre('overall');
                    setCurrentSubGenre(null);
                  }
                } catch (error) {
                  console.error('Error navigating:', error);
                }
              }}
            />
          </ErrorBoundary>

          <div className="relative z-10">
            {(currentView === 'home' || currentView === 'main-genre') && (
              <>
                <ErrorBoundary level="component">
                  <PillarNavigation
                    activePillar={activePillar}
                    onPillarChange={setActivePillar}
                    className="mb-0"
                  />
                </ErrorBoundary>

                <ErrorBoundary level="component">
                  <MainGenreNavigation
                    activeGenre={currentMainGenre}
                    onGenreChange={(genre) => {
                      try {
                        setCurrentMainGenre(genre);
                        setCurrentSubGenre(null);
                        if (genre !== 'overall') {
                          setCurrentView('main-genre');
                        } else {
                          setCurrentView('home');
                        }
                      } catch (error) {
                        console.error('Error changing genre:', error);
                      }
                    }}
                    className="mb-0"
                  />
                </ErrorBoundary>
              </>
            )}

            <main id="main-content" className="w-full px-4 md:px-8 py-8">
              <div className="mx-auto max-w-7xl">
                <ErrorBoundary level="component">
                  {currentView === 'profile' && <ProfileView />}
                  {currentView === 'about' && <AboutView />}
                  {currentView === 'custom-charts' && <CustomChartsView />}
                  {currentView === 'privacy' && <PrivacyPolicyView />}
                  {currentView === 'terms' && <TermsOfServiceView />}
                  {currentView === 'imprint' && <ImprintView />}
                  {currentView === 'admin' && (
                    <div className="space-y-6">
                      <AdminArtistManagement />
                      <ArtistDatabaseManager />
                    </div>
                  )}
                  {currentView === 'profiles-demo' && <ProfilesDemo />}
                  {currentView === 'voting' && (
                    <VotingArea
                      allTracks={[...(fanCharts || []), ...(expertCharts || []), ...(streamingCharts || [])]}
                      onTrackClick={handleTrackClick}
                    />
                  )}
                  {currentView === 'history' && <ChartHistoryView />}
                </ErrorBoundary>

                {currentView === 'main-genre' && currentMainGenre && currentMainGenre !== 'overall' && (
                  <ErrorBoundary level="component">
                    <GenreCharts
                      mainGenre={currentMainGenre}
                      activePillar={activePillar}
                      fanCharts={fanCharts || []}
                      expertCharts={expertCharts || []}
                      streamingCharts={streamingCharts || []}
                      isLoading={isLoading}
                      onTrackClick={handleTrackClick}
                    />
                  </ErrorBoundary>
                )}

                {currentView === 'home' && (
                  <>
                    {activePillar === 'overview' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <ErrorBoundary level="component">
                            <ChartCategory title="Fan Charts Top 3" tracks={filteredFanCharts || []} isLoading={isLoading} onTrackClick={handleTrackClick} />
                          </ErrorBoundary>
                          <ErrorBoundary level="component">
                            <ChartCategory title="Expert Charts Top 3" tracks={filteredExpertCharts || []} isLoading={isLoading} onTrackClick={handleTrackClick} />
                    </ErrorBoundary>
                    <ErrorBoundary level="component">
                      <ChartCategory title="Streaming Charts Top 3" tracks={filteredStreamingCharts || []} isLoading={isLoading} onTrackClick={handleTrackClick} />
                    </ErrorBoundary>
                  </div>
                </div>
              )}

              {activePillar === 'fan' && (
                <div className="space-y-6">
                  <ErrorBoundary level="component">
                    <Card className="bg-card border border-border">
                      <div className="p-4 border-b border-border">
                        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">Fan Charts</h2>
                      </div>
                      {isLoading ? (
                        <div>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
                            <ChartEntrySkeleton key={index} index={index} />
                          ))}
                        </div>
                      ) : (
                        <motion.div layout>
                          <AnimatePresence mode="popLayout">
                            {filteredFanCharts.map((track, index) => (
                              <motion.div 
                                key={track?.id || `track-${index}`}
                                layoutId={`track-${track?.id || index}`}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ 
                                  layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                                  opacity: { duration: 0.15 }
                                }}
                              >
                                <ChartEntry track={track} index={index} onClick={handleTrackClick} animate={true} />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </Card>
                  </ErrorBoundary>
                </div>
              )}

              {activePillar === 'expert' && (
                <div className="space-y-6">
                  <ErrorBoundary level="component">
                    <Card className="bg-card border border-border">
                      <div className="p-4 border-b border-border">
                        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">Expert Charts</h2>
                      </div>
                      {isLoading ? (
                        <div>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
                            <ChartEntrySkeleton key={index} index={index} />
                          ))}
                        </div>
                      ) : (
                        <motion.div layout>
                          <AnimatePresence mode="popLayout">
                            {filteredExpertCharts.map((track, index) => (
                              <motion.div 
                                key={track?.id || `track-${index}`}
                                layoutId={`track-${track?.id || index}`}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ 
                                  layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                                  opacity: { duration: 0.15 }
                                }}
                              >
                                <ChartEntry track={track} index={index} onClick={handleTrackClick} animate={true} />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </Card>
                  </ErrorBoundary>
                </div>
              )}

              {activePillar === 'streaming' && (
                <div className="space-y-6">
                  <ErrorBoundary level="component">
                    <Card className="bg-card border border-border">
                      <div className="p-4 border-b border-border">
                        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">Streaming Charts</h2>
                      </div>
                      {isLoading ? (
                        <div>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
                            <ChartEntrySkeleton key={index} index={index} />
                          ))}
                        </div>
                      ) : (
                        <motion.div layout>
                          <AnimatePresence mode="popLayout">
                            {filteredStreamingCharts.map((track, index) => (
                              <motion.div 
                                key={track?.id || `track-${index}`}
                                layoutId={`track-${track?.id || index}`}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ 
                                  layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                                  opacity: { duration: 0.15 }
                                }}
                              >
                                <ChartEntry track={track} index={index} onClick={handleTrackClick} animate={true} />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </Card>
                  </ErrorBoundary>
                </div>
                              )}
                            </>
                          )}
                        </div>
                      </main>

                      <footer className="w-full border-t border-border py-8 px-4 md:px-8 mt-16 bg-secondary/50">
                        <div className="mx-auto max-w-7xl">
                          <div className="grid md:grid-cols-3 gap-8 mb-8">
                            <div>
                              <h3 className="font-display text-lg uppercase text-foreground mb-4 tracking-tight font-semibold">Dark Charts</h3>
                              <p className="font-ui text-xs text-muted-foreground leading-relaxed">
                                {t?.('footer.tagline') || 'Independent music charts for the dark scene'}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-accent mb-4">{t?.('about.principles') || 'PRINCIPLES'}</h4>
                              <ul className="space-y-2 text-xs text-muted-foreground font-ui">
                                <li>• {t?.('about.principle1') || 'Community-driven'}</li>
                                <li>• {t?.('about.principle2') || 'Independent'}</li>
                                <li>• {t?.('about.principle3') || 'Transparent'}</li>
                                <li>• {t?.('about.principle4') || 'Authentic'}</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-accent mb-4">{t?.('nav.about') || 'ABOUT'}</h4>
                              <p className="text-xs text-muted-foreground font-ui leading-relaxed">
                                {t?.('about.builtFor') || 'Built for the dark music community'}
                              </p>
                            </div>
                          </div>
                          <div className="border-t border-border pt-4">
                            <div className="flex flex-wrap justify-center gap-4 mb-4">
                              <button
                                onClick={() => setCurrentView('privacy')}
                                className="font-ui text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                              >
                                Datenschutz
                              </button>
                              <span className="text-muted-foreground">•</span>
                              <button
                                onClick={() => setCurrentView('terms')}
                                className="font-ui text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                              >
                                AGB
                              </button>
                              <span className="text-muted-foreground">•</span>
                              <button
                                onClick={() => setCurrentView('imprint')}
                                className="font-ui text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                              >
                                Impressum
                              </button>
                            </div>
                            <p className="font-ui text-[10px] text-muted-foreground uppercase tracking-[0.3em] text-center">
                              Dark Charts &copy; {new Date().getFullYear()} — {t?.('footer.underground') || 'UNDERGROUND'}
                            </p>
                          </div>
                        </div>
                      </footer>
                    </div>

      <ErrorBoundary level="component">
        <MusicPlayer 
          currentTrack={currentTrack} 
          onNext={handleNext}
          onPrevious={handlePrevious}
          allTracks={[...(fanCharts || []), ...(expertCharts || []), ...(streamingCharts || [])]}
        />
      </ErrorBoundary>

      <ErrorBoundary level="component">
        <TrackDetailModal 
          track={selectedTrackForModal}
          isOpen={isModalOpen}
          onClose={() => {
            try {
              setIsModalOpen(false);
            } catch (error) {
              console.error('Error closing modal:', error);
            }
          }}
          allChartPositions={selectedTrackForModal ? getAllChartPositions(selectedTrackForModal) : []}
          onNavigateToChart={handleNavigateToChart}
        />
      </ErrorBoundary>

      <CookieConsentBanner />
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary level="root">
      <AuthProvider>
        <DataProvider>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
