import { useState, useEffect, useMemo, useCallback } from 'react';
import { Track, ChartWeights, ChartType, Genre, ViewType, MainGenre } from '@/types';
import { ChartCategory } from '@/components/ChartCategory';
import { ChartEntry } from '@/components/ChartEntry';
import { Card } from '@/components/ui/card';
import { Skull } from '@phosphor-icons/react';
import { MusicPlayer } from '@/components/MusicPlayer';
import { Navigation } from '@/components/Navigation';
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
import logo from '@/assets/images/Gemini_Generated_Image_fa3defa3defa3def.png';
import { DataProvider, useDataService } from '@/contexts/DataContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { Toaster } from '@/components/ui/sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminArtistManagement } from '@/components/AdminArtistManagement';
import { trackEnrichmentService } from '@/services/trackEnrichmentService';
import { nightlySyncService } from '@/services/nightlySyncService';

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
    const params = new URLSearchParams(window.location.search);
    if (window.location.pathname === '/oauth/callback') {
      setCurrentView('oauth-callback');
    }
  }, []);

  useEffect(() => {
    const loadCharts = async () => {
      setIsLoading(true);
      try {
        const data = await dataService.getAllCharts();
        setFanCharts(data.fanCharts);
        setExpertCharts(data.expertCharts);
        setStreamingCharts(data.streamingCharts);
        if (data.fanCharts.length > 0) {
          setCurrentTrack(data.fanCharts[0]);
        }

        const allTracks = [...data.fanCharts, ...data.expertCharts, ...data.streamingCharts];
        trackEnrichmentService.startBackgroundSync(allTracks);
        
        nightlySyncService.initialize();
      } catch (error) {
        console.error('Failed to load charts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharts();
  }, [dataService]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const allTracks = [...fanCharts, ...expertCharts, ...streamingCharts];
      if (allTracks.length > 0) {
        await trackEnrichmentService.syncAllTracks(allTracks);
      }
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fanCharts, expertCharts, streamingCharts]);

  const allGenres: Genre[] = useMemo(() => {
    const genreSet = new Set<Genre>();
    [...fanCharts, ...expertCharts, ...streamingCharts].forEach(track => {
      track.genres.forEach(genre => genreSet.add(genre));
    });
    return Array.from(genreSet).sort();
  }, [fanCharts, expertCharts, streamingCharts]);

  const filterByGenre = useCallback((tracks: Track[]): Track[] => {
    if (selectedGenres.length === 0) {
      return tracks;
    }
    return tracks.filter(track => 
      track.genres.some(genre => selectedGenres.includes(genre))
    );
  }, [selectedGenres]);

  const filteredFanCharts = useMemo(() => filterByGenre(fanCharts).slice(0, 10), [fanCharts, filterByGenre]);
  const filteredExpertCharts = useMemo(() => filterByGenre(expertCharts).slice(0, 10), [expertCharts, filterByGenre]);
  const filteredStreamingCharts = useMemo(() => filterByGenre(streamingCharts).slice(0, 10), [streamingCharts, filterByGenre]);

  const overallChart = useMemo(() => {
    if (!fanCharts.length || !expertCharts.length || !streamingCharts.length || !weights) {
      return [];
    }
    const chart = dataService.calculateOverallChart(weights);
    return filterByGenre(chart).slice(0, 10);
  }, [weights, fanCharts, expertCharts, streamingCharts, dataService, filterByGenre]);

  const handleWeightsChange = useCallback((newWeights: ChartWeights) => {
    setWeights(newWeights);
  }, [setWeights]);

  const handleTrackClick = useCallback(async (track: Track) => {
    const enrichedTrack = await trackEnrichmentService.enrichTrack(track);
    setSelectedTrackForModal(enrichedTrack);
    setIsModalOpen(true);
    setCurrentTrack(enrichedTrack);
  }, []);

  const handleToggleGenre = useCallback((genre: Genre) => {
    setSelectedGenres(current => {
      if (current.includes(genre)) {
        return current.filter(g => g !== genre);
      }
      return [...current, genre];
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedGenres([]);
  }, []);

  const getAllChartPositions = useCallback((track: Track) => {
    const positions: { chartName: string; position: number; chartType?: ChartType; mainGenre?: MainGenre; subGenre?: Genre }[] = [];
    
    const fanIndex = fanCharts.findIndex(t => t.id === track.id);
    if (fanIndex !== -1 && fanIndex < 10) {
      positions.push({ chartName: 'Fan Charts', position: fanIndex + 1, chartType: 'fan' });
    }
    
    const expertIndex = expertCharts.findIndex(t => t.id === track.id);
    if (expertIndex !== -1 && expertIndex < 10) {
      positions.push({ chartName: 'Expert Charts', position: expertIndex + 1, chartType: 'expert' });
    }
    
    const streamingIndex = streamingCharts.findIndex(t => t.id === track.id);
    if (streamingIndex !== -1 && streamingIndex < 10) {
      positions.push({ chartName: 'Streaming Charts', position: streamingIndex + 1, chartType: 'streaming' });
    }
    
    const overallIndex = overallChart.findIndex(t => t.id === track.id);
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

    Object.entries(mainGenreMap).forEach(([mainGenre, subGenres]) => {
      const mainGenreTracks = [...fanCharts, ...expertCharts, ...streamingCharts].filter(t =>
        t.genres.some(g => subGenres.includes(g))
      );
      const mainGenreIndex = mainGenreTracks.findIndex(t => t.id === track.id);
      if (mainGenreIndex !== -1 && mainGenreIndex < 10) {
        positions.push({
          chartName: `${mainGenre} Charts`,
          position: mainGenreIndex + 1,
          mainGenre: mainGenre as MainGenre
        });
      }

      track.genres.forEach(genre => {
        if (subGenres.includes(genre)) {
          const subGenreTracks = mainGenreTracks.filter(t => t.genres.includes(genre));
          const subGenreIndex = subGenreTracks.findIndex(t => t.id === track.id);
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
    });

    return positions;
  }, [fanCharts, expertCharts, streamingCharts, overallChart]);

  const handleNavigateToChart = useCallback((chartType?: ChartType, mainGenre?: MainGenre, subGenre?: Genre) => {
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
  }, []);

  const handleNext = useCallback(() => {
    if (!currentTrack) return;
    const allTracks = activePillar === 'overview' ? overallChart : activePillar === 'fan' ? filteredFanCharts : activePillar === 'expert' ? filteredExpertCharts : filteredStreamingCharts;
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < allTracks.length - 1) {
      setCurrentTrack(allTracks[currentIndex + 1]);
    }
  }, [currentTrack, activePillar, filteredFanCharts, filteredExpertCharts, filteredStreamingCharts, overallChart]);

  const handlePrevious = useCallback(() => {
    if (!currentTrack) return;
    const allTracks = activePillar === 'overview' ? overallChart : activePillar === 'fan' ? filteredFanCharts : activePillar === 'expert' ? filteredExpertCharts : filteredStreamingCharts;
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(allTracks[currentIndex - 1]);
    }
  }, [currentTrack, activePillar, filteredFanCharts, filteredExpertCharts, filteredStreamingCharts, overallChart]);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden pb-24">
      {currentView === 'oauth-callback' ? (
        <OAuthCallback />
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

          <Navigation 
            currentView={currentView} 
            onNavigate={(view: ViewType) => {
              setCurrentView(view);
              if (view === 'home') {
                setCurrentMainGenre('overall');
                setCurrentSubGenre(null);
              }
            }}
          />

          <div className="relative z-10">
            <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
              <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-6 md:py-8">
                <div className="flex flex-col items-center justify-center gap-4">
                  <img 
                    src={logo} 
                    alt="Dark Charts" 
                    className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 object-contain chromatic-hover"
                  />
                  <p className="font-ui text-[10px] md:text-xs text-muted-foreground tracking-[0.4em] uppercase font-medium">
                    {t('header.subtitle')}
                  </p>
                </div>
              </div>
            </header>

            <main className="max-w-[1800px] mx-auto px-4 md:px-8 py-8">
              {currentView === 'profile' && <ProfileView />}
              {currentView === 'about' && <AboutView />}
              {currentView === 'custom-charts' && <CustomChartsView />}
              {currentView === 'admin' && <AdminArtistManagement />}
              {currentView === 'voting' && (
                <VotingArea 
                  allTracks={[...fanCharts, ...expertCharts, ...streamingCharts]}
              onTrackClick={handleTrackClick}
            />
          )}
          {currentView === 'history' && <ChartHistoryView />}
          
          {(currentView === 'home' || currentView === 'main-genre') && (
            <>
              <PillarNavigation 
                activePillar={activePillar}
                onPillarChange={setActivePillar}
                className="mb-6 md:sticky md:top-0 md:z-40 bg-background/95 backdrop-blur-sm py-4 border-b border-border fixed top-0 left-0 right-0 z-50"
              />

              <MainGenreNavigation
                activeGenre={currentMainGenre}
                onGenreChange={(genre) => {
                  setCurrentMainGenre(genre);
                  setCurrentSubGenre(null);
                  if (genre !== 'overall') {
                    setCurrentView('main-genre');
                  } else {
                    setCurrentView('home');
                  }
                }}
                className="mb-6"
              />
            </>
          )}

          {currentView === 'main-genre' && currentMainGenre && currentMainGenre !== 'overall' && (
            <GenreCharts 
              mainGenre={currentMainGenre}
              activePillar={activePillar}
              fanCharts={fanCharts}
              expertCharts={expertCharts}
              streamingCharts={streamingCharts}
              isLoading={isLoading}
              onTrackClick={handleTrackClick}
            />
          )}
          
          {currentView === 'home' && (
            <>
              {activePillar === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <ChartCategory title="Fan Charts Top 3" tracks={filteredFanCharts} isLoading={isLoading} onTrackClick={handleTrackClick} />
                    <ChartCategory title="Expert Charts Top 3" tracks={filteredExpertCharts} isLoading={isLoading} onTrackClick={handleTrackClick} />
                    <ChartCategory title="Streaming Charts Top 3" tracks={filteredStreamingCharts} isLoading={isLoading} onTrackClick={handleTrackClick} />
                  </div>
                </div>
              )}

              {activePillar === 'fan' && (
                <div className="space-y-6">
                  {!isLoading && filteredFanCharts.length > 0 && (
                    <Card className="bg-card border border-border">
                      <div className="p-4 border-b border-border">
                        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">Fan Charts</h2>
                      </div>
                      <motion.div layout>
                        <AnimatePresence mode="popLayout">
                          {filteredFanCharts.map((track, index) => (
                            <motion.div 
                              key={track.id}
                              layoutId={`track-${track.id}`}
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
                    </Card>
                  )}
                </div>
              )}

              {activePillar === 'expert' && (
                <div className="space-y-6">
                  {!isLoading && filteredExpertCharts.length > 0 && (
                    <Card className="bg-card border border-border">
                      <div className="p-4 border-b border-border">
                        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">Expert Charts</h2>
                      </div>
                      <motion.div layout>
                        <AnimatePresence mode="popLayout">
                          {filteredExpertCharts.map((track, index) => (
                            <motion.div 
                              key={track.id}
                              layoutId={`track-${track.id}`}
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
                    </Card>
                  )}
                </div>
              )}

              {activePillar === 'streaming' && (
                <div className="space-y-6">
                  {!isLoading && filteredStreamingCharts.length > 0 && (
                    <Card className="bg-card border border-border">
                      <div className="p-4 border-b border-border">
                        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">Streaming Charts</h2>
                      </div>
                      <motion.div layout>
                        <AnimatePresence mode="popLayout">
                          {filteredStreamingCharts.map((track, index) => (
                            <motion.div 
                              key={track.id}
                              layoutId={`track-${track.id}`}
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
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </main>

        <footer className="border-t border-border py-8 px-4 md:px-8 mt-16 bg-secondary/50">
          <div className="max-w-[1800px] mx-auto">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <h3 className="display-font text-lg uppercase text-foreground mb-3 tracking-tight font-semibold">Dark Charts</h3>
                <p className="font-ui text-xs text-muted-foreground leading-relaxed">
                  {t('footer.tagline')}
                </p>
              </div>
              <div>
                <h4 className="font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-accent mb-3">{t('about.principles')}</h4>
                <ul className="space-y-1 text-xs text-muted-foreground font-ui">
                  <li>• {t('about.principle1')}</li>
                  <li>• {t('about.principle2')}</li>
                  <li>• {t('about.principle3')}</li>
                  <li>• {t('about.principle4')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-accent mb-3">{t('nav.about')}</h4>
                <p className="text-xs text-muted-foreground font-ui leading-relaxed">
                  {t('about.builtFor')}
                </p>
              </div>
            </div>
            <div className="border-t border-border pt-4 text-center">
              <p className="font-ui text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
                Dark Charts &copy; {new Date().getFullYear()} — {t('footer.underground')}
              </p>
            </div>
          </div>
        </footer>
      </div>

      <MusicPlayer 
        currentTrack={currentTrack} 
        onNext={handleNext}
        onPrevious={handlePrevious}
      />

      <TrackDetailModal 
        track={selectedTrackForModal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        allChartPositions={selectedTrackForModal ? getAllChartPositions(selectedTrackForModal) : []}
        onNavigateToChart={handleNavigateToChart}
      />
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
