import { useState, useEffect, useMemo, useCallback } from 'react';
import { Track, ChartWeights, ChartType, Genre, ViewType, MainGenre } from '@/types';
import { ChartCategory } from '@/components/ChartCategory';
import { ChartEntry } from '@/components/ChartEntry';
import { Card } from '@/components/ui/card';
import { MusicPlayer } from '@/components/MusicPlayer';
import { Navigation } from '@/components/Navigation';
import { ProfileView } from '@/components/ProfileView';
import { AboutView } from '@/components/AboutView';
import { CustomChartsView } from '@/components/CustomChartsView';
import { SubGenreNavigation } from '@/components/SubGenreNavigation';
import { useKV } from '@github/spark/hooks';
import logo from '@/assets/images/Gemini_Generated_Image_fa3defa3defa3def.png';
import { DataProvider, useDataService } from '@/contexts/DataContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { motion, AnimatePresence } from 'framer-motion';

const mainGenres: (MainGenre | 'overall')[] = ['overall', 'Gothic', 'Metal', 'Dark Electro', 'Crossover'];
const pillarOptions: ChartType[] = ['overall', 'fan', 'expert', 'streaming'];

function AppContent() {
  const dataService = useDataService();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [currentMainGenre, setCurrentMainGenre] = useState<MainGenre | 'overall'>('overall');
  const [currentSubGenre, setCurrentSubGenre] = useState<Genre | null>(null);
  const [activePillar, setActivePillar] = useState<ChartType>('overall');
  const [fanCharts, setFanCharts] = useState<Track[]>([]);
  const [expertCharts, setExpertCharts] = useState<Track[]>([]);
  const [streamingCharts, setStreamingCharts] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  
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

  const overallChart = useMemo(() => {
    if (!fanCharts.length || !expertCharts.length || !streamingCharts.length || !weights) {
      return [];
    }
    return dataService.calculateOverallChart(weights);
  }, [weights, fanCharts, expertCharts, streamingCharts, dataService]);

  const handleTrackClick = useCallback((track: Track) => {
    setCurrentTrack(track);
  }, []);

  const handleNext = useCallback(() => {
    if (!currentTrack) return;
    const allTracks = activePillar === 'fan' ? fanCharts : activePillar === 'expert' ? expertCharts : activePillar === 'streaming' ? streamingCharts : overallChart;
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < allTracks.length - 1) {
      setCurrentTrack(allTracks[currentIndex + 1]);
    }
  }, [currentTrack, activePillar, fanCharts, expertCharts, streamingCharts, overallChart]);

  const handlePrevious = useCallback(() => {
    if (!currentTrack) return;
    const allTracks = activePillar === 'fan' ? fanCharts : activePillar === 'expert' ? expertCharts : activePillar === 'streaming' ? streamingCharts : overallChart;
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(allTracks[currentIndex - 1]);
    }
  }, [currentTrack, activePillar, fanCharts, expertCharts, streamingCharts, overallChart]);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden pb-24">
      <Toaster position="top-right" />
      
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[100] opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
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
            rgba(255, 255, 255, 0.01) 2px,
            rgba(255, 255, 255, 0.01) 4px
          )`,
        }}
      />

      <div className="fixed inset-0 pointer-events-none z-[98]" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, transparent 70%, oklch(0.12 0 0 / 0.8) 100%)'
      }} />

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
            <div className="flex flex-col items-center justify-center gap-6">
              <img 
                src={logo} 
                alt="Dark Charts" 
                className="w-64 h-64 md:w-96 md:h-96 lg:w-[32rem] lg:h-[32rem] object-contain chromatic-hover"
              />
              
              {currentView === 'home' && (
                <>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {pillarOptions.map((pillar) => (
                      <button
                        key={pillar}
                        onClick={() => setActivePillar(pillar)}
                        className={`px-6 py-3 border border-border snap-transition font-ui text-xs uppercase tracking-[0.15em] font-semibold
                          ${activePillar === pillar 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-card hover:bg-primary/30'}`}
                      >
                        {pillar === 'overall' ? 'Übersicht' : pillar === 'fan' ? 'Fan' : pillar === 'expert' ? 'Expert' : 'Stream'}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {mainGenres.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => {
                          setCurrentMainGenre(genre);
                          setCurrentSubGenre(null);
                        }}
                        className={`px-5 py-2 border border-border snap-transition font-ui text-[10px] uppercase tracking-[0.15em] font-semibold
                          ${currentMainGenre === genre 
                            ? 'bg-accent text-accent-foreground' 
                            : 'bg-secondary hover:bg-accent/30'}`}
                      >
                        {genre === 'overall' ? 'Overall' : genre}
                      </button>
                    ))}
                  </div>

                  {currentMainGenre !== 'overall' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full"
                    >
                      <SubGenreNavigation
                        mainGenre={currentMainGenre}
                        activeSubGenre={currentSubGenre}
                        onSubGenreChange={setCurrentSubGenre}
                        className=""
                      />
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-[1800px] mx-auto px-4 md:px-8 py-8">
          {currentView === 'profile' && <ProfileView />}
          {currentView === 'about' && <AboutView />}
          {currentView === 'custom-charts' && <CustomChartsView />}
          
          {currentView === 'home' && (
            <>
              {activePillar === 'overall' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <ChartCategory title="Fan Charts Top 3" tracks={fanCharts} isLoading={isLoading} />
                    <ChartCategory title="Expert Charts Top 3" tracks={expertCharts} isLoading={isLoading} />
                    <ChartCategory title="Streaming Charts Top 3" tracks={streamingCharts} isLoading={isLoading} />
                  </div>
                </div>
              )}

              {activePillar === 'fan' && (
                <div className="space-y-6">
                  {!isLoading && fanCharts.length > 0 && (
                    <Card className="bg-card border border-border">
                      <div className="p-4 border-b border-border">
                        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">Fan Charts</h2>
                      </div>
                      <motion.div layout>
                        <AnimatePresence mode="popLayout">
                          {fanCharts.map((track, index) => (
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
                  {!isLoading && expertCharts.length > 0 && (
                    <Card className="bg-card border border-border">
                      <div className="p-4 border-b border-border">
                        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">Expert Charts</h2>
                      </div>
                      <motion.div layout>
                        <AnimatePresence mode="popLayout">
                          {expertCharts.map((track, index) => (
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
                  {!isLoading && streamingCharts.length > 0 && (
                    <Card className="bg-card border border-border">
                      <div className="p-4 border-b border-border">
                        <h2 className="display-font text-xl uppercase text-foreground tracking-tight font-semibold">Streaming Charts</h2>
                      </div>
                      <motion.div layout>
                        <AnimatePresence mode="popLayout">
                          {streamingCharts.map((track, index) => (
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
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div>
                <h3 className="display-font text-lg uppercase text-foreground mb-3 tracking-tight font-semibold">Dark Charts</h3>
                <p className="font-ui text-xs text-muted-foreground leading-relaxed">
                  Unabhängige Musikcharts für Metal & Gothic Szene. Fair, transparent und frei von Pay-to-Win.
                </p>
              </div>
              <div>
                <h4 className="font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-accent mb-3">Prinzipien</h4>
                <ul className="space-y-1 text-xs text-muted-foreground font-ui">
                  <li>• Keine Pay-to-Play</li>
                  <li>• Community-getrieben</li>
                  <li>• Transparentes Ranking</li>
                  <li>• Szene-fokussiert</li>
                </ul>
              </div>
              <div>
                <h4 className="font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-accent mb-3">Rechtliches</h4>
                <ul className="space-y-1 text-xs text-muted-foreground font-ui">
                  <li><a href="#" className="hover:text-accent snap-transition">Impressum</a></li>
                  <li><a href="#" className="hover:text-accent snap-transition">Datenschutz</a></li>
                  <li><a href="#" className="hover:text-accent snap-transition">Cookie-Einstellungen</a></li>
                  <li><a href="#" className="hover:text-accent snap-transition">AGB</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-accent mb-3">Über Uns</h4>
                <p className="text-xs text-muted-foreground font-ui leading-relaxed">
                  Gebaut für Fans, von Fans. Unterstützung Underground-Künstler durch faire Darstellung.
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
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
