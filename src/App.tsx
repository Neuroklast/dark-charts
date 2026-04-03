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
import { PillarNavigation } from '@/components/PillarNavigation';
import { MainGenreNavigation } from '@/components/MainGenreNavigation';
import { SubGenreNavigation } from '@/components/SubGenreNavigation';
import { TrackDetailModal } from '@/components/TrackDetailModal';
import { useKV } from '@github/spark/hooks';
import logo from '@/assets/images/Gemini_Generated_Image_fa3defa3defa3def.png';
import { DataProvider, useDataService } from '@/contexts/DataContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { motion, AnimatePresence } from 'framer-motion';

function AppContent() {
  const dataService = useDataService();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [currentMainGenre, setCurrentMainGenre] = useState<MainGenre | 'overall'>('overall');
  const [currentSubGenre, setCurrentSubGenre] = useState<Genre | null>(null);
  const [activePillar, setActivePillar] = useState<ChartType>('fan');
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
      } catch (error) {
        console.error('Failed to load charts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharts();
  }, [dataService]);

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

  const filteredFanCharts = useMemo(() => filterByGenre(fanCharts), [fanCharts, filterByGenre]);
  const filteredExpertCharts = useMemo(() => filterByGenre(expertCharts), [expertCharts, filterByGenre]);
  const filteredStreamingCharts = useMemo(() => filterByGenre(streamingCharts), [streamingCharts, filterByGenre]);

  const overallChart = useMemo(() => {
    if (!fanCharts.length || !expertCharts.length || !streamingCharts.length || !weights) {
      return [];
    }
    const chart = dataService.calculateOverallChart(weights);
    return filterByGenre(chart);
  }, [weights, fanCharts, expertCharts, streamingCharts, dataService, filterByGenre]);

  const handleWeightsChange = useCallback((newWeights: ChartWeights) => {
    setWeights(newWeights);
  }, [setWeights]);

  const handleTrackClick = useCallback((track: Track) => {
    setSelectedTrackForModal(track);
    setIsModalOpen(true);
    setCurrentTrack(track);
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

  const handleNext = useCallback(() => {
    if (!currentTrack) return;
    const allTracks = activePillar === 'fan' ? filteredFanCharts : activePillar === 'expert' ? filteredExpertCharts : activePillar === 'streaming' ? filteredStreamingCharts : overallChart;
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < allTracks.length - 1) {
      setCurrentTrack(allTracks[currentIndex + 1]);
    }
  }, [currentTrack, activePillar, filteredFanCharts, filteredExpertCharts, filteredStreamingCharts, overallChart]);

  const handlePrevious = useCallback(() => {
    if (!currentTrack) return;
    const allTracks = activePillar === 'fan' ? filteredFanCharts : activePillar === 'expert' ? filteredExpertCharts : activePillar === 'streaming' ? filteredStreamingCharts : overallChart;
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(allTracks[currentIndex - 1]);
    }
  }, [currentTrack, activePillar, filteredFanCharts, filteredExpertCharts, filteredStreamingCharts, overallChart]);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden pb-24">
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

      <div className="relative z-10 md:ml-64">
        <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-6 md:py-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <img 
                src={logo} 
                alt="Dark Charts" 
                className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 object-contain chromatic-hover"
              />
              <p className="font-ui text-[10px] md:text-xs text-muted-foreground tracking-[0.4em] uppercase font-medium">
                Metal • Gothic • Alternative • Dark Electro
              </p>
            </div>
          </div>
        </header>

        <main className="max-w-[1800px] mx-auto px-4 md:px-8 py-8">
          {currentView === 'profile' && <ProfileView />}
          {currentView === 'about' && <AboutView />}
          {currentView === 'custom-charts' && <CustomChartsView />}
          {currentView === 'main-genre' && currentMainGenre && currentMainGenre !== 'overall' && (
            <GenreCharts 
              mainGenre={currentMainGenre}
              fanCharts={fanCharts}
              expertCharts={expertCharts}
              streamingCharts={streamingCharts}
              isLoading={isLoading}
              onTrackClick={handleTrackClick}
            />
          )}
          
          {currentView === 'home' && (
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
                }}
                className="mb-6"
              />

              {currentMainGenre !== 'overall' && (
                <SubGenreNavigation
                  mainGenre={currentMainGenre}
                  activeSubGenre={currentSubGenre}
                  onSubGenreChange={setCurrentSubGenre}
                  className="mb-8"
                />
              )}

              {activePillar === 'fan' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <ChartCategory title="Fan Charts Top 3" tracks={filteredFanCharts} isLoading={isLoading} />
                    <ChartCategory title="Expert Charts Top 3" tracks={filteredExpertCharts} isLoading={isLoading} />
                    <ChartCategory title="Streaming Charts Top 3" tracks={filteredStreamingCharts} isLoading={isLoading} />
                  </div>

                  {!isLoading && filteredFanCharts.length > 3 && (
                    <Card className="bg-card border border-border">
                      <div className="p-4 border-b border-border">
                        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">Full Fan Charts</h2>
                      </div>
                      <motion.div layout>
                        <AnimatePresence mode="popLayout">
                          {filteredFanCharts.map((track, index) => (
                            <motion.div 
                              key={track.id} 
                              onClick={() => handleTrackClick(track)} 
                              className="cursor-pointer"
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.15 }}
                            >
                              <ChartEntry track={track} index={index} />
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <ChartCategory title="Fan Charts Top 3" tracks={filteredFanCharts} isLoading={isLoading} />
                    <ChartCategory title="Expert Charts Top 3" tracks={filteredExpertCharts} isLoading={isLoading} />
                    <ChartCategory title="Streaming Charts Top 3" tracks={filteredStreamingCharts} isLoading={isLoading} />
                  </div>

                  {!isLoading && filteredExpertCharts.length > 3 && (
                    <Card className="bg-card border border-border">
                      <div className="p-4 border-b border-border">
                        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">Full Expert Charts</h2>
                      </div>
                      <motion.div layout>
                        <AnimatePresence mode="popLayout">
                          {filteredExpertCharts.map((track, index) => (
                            <motion.div 
                              key={track.id} 
                              onClick={() => handleTrackClick(track)} 
                              className="cursor-pointer"
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.15 }}
                            >
                              <ChartEntry track={track} index={index} />
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <ChartCategory title="Fan Charts Top 3" tracks={filteredFanCharts} isLoading={isLoading} />
                    <ChartCategory title="Expert Charts Top 3" tracks={filteredExpertCharts} isLoading={isLoading} />
                    <ChartCategory title="Streaming Charts Top 3" tracks={filteredStreamingCharts} isLoading={isLoading} />
                  </div>

                  {!isLoading && filteredStreamingCharts.length > 3 && (
                    <Card className="bg-card border border-border">
                      <div className="p-4 border-b border-border">
                        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">Full Streaming Charts</h2>
                      </div>
                      <motion.div layout>
                        <AnimatePresence mode="popLayout">
                          {filteredStreamingCharts.map((track, index) => (
                            <motion.div 
                              key={track.id} 
                              onClick={() => handleTrackClick(track)} 
                              className="cursor-pointer"
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.15 }}
                            >
                              <ChartEntry track={track} index={index} />
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
                  Independent music charts for Metal & Gothic scene. Fair, transparent, and free from pay-to-win mechanics.
                </p>
              </div>
              <div>
                <h4 className="font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-accent mb-3">Principles</h4>
                <ul className="space-y-1 text-xs text-muted-foreground font-ui">
                  <li>• No pay-to-play</li>
                  <li>• Community-driven</li>
                  <li>• Transparent ranking</li>
                  <li>• Scene-focused</li>
                </ul>
              </div>
              <div>
                <h4 className="font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-accent mb-3">About</h4>
                <p className="text-xs text-muted-foreground font-ui leading-relaxed">
                  Built for fans, by fans. Supporting underground artists through fair representation and authentic community engagement.
                </p>
              </div>
            </div>
            <div className="border-t border-border pt-4 text-center">
              <p className="font-ui text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
                Dark Charts &copy; {new Date().getFullYear()} — Underground Never Dies
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
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
