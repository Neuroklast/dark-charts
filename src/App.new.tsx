import { useState, useEffect, useMemo, useCallback } from 'react';
import { Track, ChartWeights, ChartType, Genre, ViewType, MainGenre } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartCategory } from '@/components/ChartCategory';
import { ChartEntry } from '@/components/ChartEntry';
import { WeightingPanel } from '@/components/WeightingPanel';
import { GenreFilters } from '@/components/GenreFilters';
import { Card } from '@/components/ui/card';
import { Skull, Funnel } from '@phosphor-icons/react';
import { MusicPlayer } from '@/components/MusicPlayer';
import { Navigation } from '@/components/Navigation';
import { GenreCharts } from '@/components/GenreCharts';
import { ProfileView } from '@/components/ProfileView';
import { AboutView } from '@/components/AboutView';
import { useKV } from '@github/spark/hooks';
import logo from '@/assets/images/Gemini_Generated_Image_fa3defa3defa3def.png';
import { DataProvider, useDataService } from '@/contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';

function AppContent() {
  const dataService = useDataService();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [currentMainGenre, setCurrentMainGenre] = useState<MainGenre | null>(null);
  const [activeTab, setActiveTab] = useState<ChartType>('fan');
  const [fanCharts, setFanCharts] = useState<Track[]>([]);
  const [expertCharts, setExpertCharts] = useState<Track[]>([]);
  const [streamingCharts, setStreamingCharts] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
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
    const allTracks = activeTab === 'fan' ? filteredFanCharts : activeTab === 'expert' ? filteredExpertCharts : activeTab === 'streaming' ? filteredStreamingCharts : overallChart;
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < allTracks.length - 1) {
      setCurrentTrack(allTracks[currentIndex + 1]);
    }
  }, [currentTrack, activeTab, filteredFanCharts, filteredExpertCharts, filteredStreamingCharts, overallChart]);

  const handlePrevious = useCallback(() => {
    if (!currentTrack) return;
    const allTracks = activeTab === 'fan' ? filteredFanCharts : activeTab === 'expert' ? filteredExpertCharts : activeTab === 'streaming' ? filteredStreamingCharts : overallChart;
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(allTracks[currentIndex - 1]);
    }
  }, [currentTrack, activeTab, filteredFanCharts, filteredExpertCharts, filteredStreamingCharts, overallChart]);

  const handleNavigation = useCallback((view: ViewType, mainGenre?: MainGenre) => {
    setCurrentView(view);
    if (mainGenre) {
      setCurrentMainGenre(mainGenre);
    } else {
      setCurrentMainGenre(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden pb-24">
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[100] opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)"/>
      </svg>

      <div 
        className="fixed inset-0 pointer-events-none z-[99]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.008) 2px,
            rgba(255, 255, 255, 0.008) 4px
          )`,
          animation: 'terminal-flicker 3s infinite'
        }}
      />

      <div className="fixed inset-0 pointer-events-none z-[98]" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, transparent 70%, oklch(0.04 0 0 / 0.6) 100%)'
      }} />

      <Navigation 
        currentView={currentView}
        currentMainGenre={currentMainGenre}
        onNavigate={handleNavigation}
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
          {currentView === 'home' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="display-font text-2xl uppercase tracking-wider text-foreground font-semibold">
                  Overall Charts
                </h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 border ${showFilters ? 'bg-accent border-accent text-accent-foreground' : 'bg-card border-border hover:bg-accent/20'} snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold`}
                >
                  <Funnel weight="bold" className="w-4 h-4" />
                  Filters
                  {selectedGenres.length > 0 && (
                    <span className="ml-1 bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                      {selectedGenres.length}
                    </span>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'linear' }}
                    className="overflow-hidden mb-6"
                  >
                    <Card className="bg-card border border-border p-4">
                      <GenreFilters
                        availableGenres={allGenres}
                        selectedGenres={selectedGenres}
                        onToggleGenre={handleToggleGenre}
                        onClearFilters={handleClearFilters}
                      />
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ChartType)} className="space-y-6">
                <TabsList className="w-full md:w-auto grid grid-cols-2 md:flex md:gap-0 bg-card border border-border p-0 h-auto">
                  <TabsTrigger 
                    value="fan" 
                    className="data-font uppercase tracking-[0.15em] font-bold text-[10px] md:text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground snap-transition px-6 py-3 border-r border-border hover:bg-primary/20"
                  >
                    Fan Charts
                  </TabsTrigger>
                  <TabsTrigger 
                    value="expert"
                    className="data-font uppercase tracking-[0.15em] font-bold text-[10px] md:text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground snap-transition px-6 py-3 border-r border-border hover:bg-primary/20"
                  >
                    Expert Charts
                  </TabsTrigger>
                  <TabsTrigger 
                    value="streaming"
                    className="data-font uppercase tracking-[0.15em] font-bold text-[10px] md:text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground snap-transition px-6 py-3 border-r border-border hover:bg-primary/20"
                  >
                    Streaming
                  </TabsTrigger>
                  <TabsTrigger 
                    value="overall"
                    className="data-font uppercase tracking-[0.15em] font-bold text-[10px] md:text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground snap-transition px-6 py-3 hover:bg-accent/20"
                  >
                    Overall
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="fan" className="space-y-6">
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
                </TabsContent>

                <TabsContent value="expert" className="space-y-6">
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
                </TabsContent>

                <TabsContent value="streaming" className="space-y-6">
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
                </TabsContent>

                <TabsContent value="overall" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      {overallChart.length > 0 ? (
                        <Card className="bg-card border border-border">
                          <div className="p-4 border-b border-border">
                            <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">Custom Overall Chart</h2>
                          </div>
                          <motion.div layout>
                            <AnimatePresence mode="popLayout">
                              {overallChart.slice(0, 10).map((track, index) => (
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
                      ) : (
                        <Card className="bg-card border border-border p-12 text-center relative overflow-hidden">
                          <div className="absolute inset-0 opacity-5">
                            <div className="absolute inset-0" style={{
                              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, var(--border) 8px, var(--border) 16px)`
                            }} />
                          </div>
                          <div className="relative">
                            <Skull weight="duotone" className="w-20 h-20 mx-auto text-muted-foreground mb-4 opacity-40" />
                            <h3 className="display-font text-3xl md:text-4xl uppercase text-muted-foreground mb-3 tracking-tight font-semibold">
                              No Data Yet
                            </h3>
                            <p className="font-ui text-muted-foreground uppercase tracking-[0.2em] text-xs">
                              Adjust the weights to generate your chart
                            </p>
                          </div>
                        </Card>
                      )}
                    </div>

                    <div>
                      {weights && <WeightingPanel weights={weights} onChange={handleWeightsChange} />}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          {currentView === 'main-genre' && currentMainGenre && (
            <GenreCharts
              mainGenre={currentMainGenre}
              fanCharts={fanCharts}
              expertCharts={expertCharts}
              streamingCharts={streamingCharts}
              isLoading={isLoading}
              onTrackClick={handleTrackClick}
            />
          )}

          {currentView === 'custom-charts' && (
            <div className="space-y-6">
              <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold">
                Custom Charts
              </h1>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  {overallChart.length > 0 ? (
                    <Card className="bg-card border border-border">
                      <div className="p-4 border-b border-border">
                        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">Custom Weighted Chart</h2>
                      </div>
                      <motion.div layout>
                        <AnimatePresence mode="popLayout">
                          {overallChart.slice(0, 10).map((track, index) => (
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
                  ) : (
                    <Card className="bg-card border border-border p-12 text-center">
                      <Skull weight="duotone" className="w-20 h-20 mx-auto text-muted-foreground mb-4 opacity-40" />
                      <p className="font-ui text-sm uppercase tracking-[0.2em] text-muted-foreground">
                        Adjust weights to generate your custom chart
                      </p>
                    </Card>
                  )}
                </div>
                <div>
                  {weights && <WeightingPanel weights={weights} onChange={handleWeightsChange} />}
                </div>
              </div>
            </div>
          )}

          {currentView === 'profile' && <ProfileView />}
          {currentView === 'about' && <AboutView />}
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
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;
