import { useState, useEffect, useMemo, useCallback } from 'react';
import { Track, ChartType, Genre, ViewType, MainGenre } from '@/types';
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
import { ExpertVotingArea } from '@/components/ExpertVotingArea';
import { VoteConfirmationView } from '@/components/VoteConfirmationView';
import { ChartHistoryView } from '@/components/ChartHistoryView';
import { ChartArchiveView } from '@/components/ChartArchiveView';
import { PillarNavigation } from '@/components/PillarNavigation';
import { MainGenreNavigation } from '@/components/MainGenreNavigation';
import { SubGenreNavigation } from '@/components/SubGenreNavigation';
import { TrackDetailModal } from '@/components/TrackDetailModal';
import { OAuthCallback } from '@/components/OAuthCallback';
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
import { safeFilter, safeSlice, safeFindIndex } from '@/lib/safe-utils';
import { ChartEntrySkeleton } from '@/components/skeletons';
import { ProfilesDemo } from '@/components/ProfilesDemo';
import { PrivacyPolicyView } from '@/components/PrivacyPolicyView';
import { TermsOfServiceView } from '@/components/TermsOfServiceView';
import { ImprintView } from '@/components/ImprintView';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { mainGenreMap } from '@/lib/config/genres';
import { PromotionalSlot } from '@/components/PromotionalSlot';
import { useChartData } from '@/hooks/useChartData';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DashboardMetricsContainer } from '@/components/admin/DashboardMetricsContainer';
import { UserManagementContainer } from '@/components/admin/UserManagementContainer';
import { ArtistBlacklistContainer } from '@/components/admin/ArtistBlacklistContainer';
import { ChartControlContainer } from '@/components/admin/ChartControlContainer';
import { PromotionApprovalContainer } from '@/components/admin/PromotionApprovalContainer';
import { SystemSettingsContainer } from '@/components/admin/SystemSettingsContainer';

function AppContent() {
  const [activePromotion, setActivePromotion] = useState<{ type?: string; name?: string; imageUrl?: string } | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const { user, getAuthToken } = useAuth();

  useEffect(() => {
    fetch('/api/promotions')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.promotions && data.promotions.length > 0) {
          // just take the first active one for demo purposes
          const promo = data.promotions[0];
          setActivePromotion({
            type: promo.label || promo.type,
            name: promo.name,
            imageUrl: promo.imageUrl
          });
        }
      })
      .catch(err => logger.error('Failed to load promotions', err));
  }, []);

  useEffect(() => {
    if (!user) return;
    const checkVoteStatus = async () => {
      try {
        const token = await getAuthToken();
        const res = await fetch('/api/vote/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.hasVoted) {
          setHasVoted(true);
        }
      } catch (err) {
        logger.error('Failed to check vote status in AppContent', err);
      }
    };
    checkVoteStatus();
  }, [user, getAuthToken]);
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [currentMainGenre, setCurrentMainGenre] = useState<MainGenre | 'overall'>('overall');
  const [currentSubGenre, setCurrentSubGenre] = useState<Genre | null>(null);
  const [activePillar, setActivePillar] = useState<ChartType | 'overview'>('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTrackForModal, setSelectedTrackForModal] = useState<Track | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    fanCharts,
    expertCharts,
    streamingCharts,
    isLoading,
    currentTrack,
    setCurrentTrack,
    selectedGenres,
    setSelectedGenres,
    allGenres,
    filterByGenre,
    filteredFanCharts,
    filteredExpertCharts,
    filteredStreamingCharts,
    overallChart,
    dataService,
  } = useChartData();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (window.location.pathname === '/oauth/callback') {
        setCurrentView('oauth-callback');
      } else if (window.location.pathname === '/charts/archive') {
        setCurrentView('archive');
      }
    } catch (error) {
      logger.error('Error checking URL parameters:', { error });
    }
  }, []);

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
      logger.error('Error computing visible tracks:', { error });
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
      logger.error('Error computing player tracks:', { error });
      return [];
    }
  }, [activePillar, overallChart, filteredFanCharts, filteredExpertCharts, filteredStreamingCharts, fanCharts, expertCharts, streamingCharts]);

  useUpcomingTrackPreloader(currentTrack, allTracksForPlayer, 5);
  useVisibleTracksPreloader(currentVisibleTracks, 10);

  const handleTrackClick = useCallback(async (track: Track) => {
    try {
      if (!track) {
        logger.warn('Invalid track object');
        return;
      }

      let enrichedTrack = track;
      if (trackEnrichmentService && typeof trackEnrichmentService.enrichTrack === 'function') {
        try {
          enrichedTrack = await trackEnrichmentService.enrichTrack(track);
        } catch (enrichmentError) {
          logger.error('Failed to enrich track:', { error: enrichmentError });
        }
      }

      setSelectedTrackForModal(enrichedTrack);
      setIsModalOpen(true);
      setCurrentTrack(enrichedTrack);
    } catch (error) {
      logger.error('Error handling track click:', { error });
    }
  }, []);

  const handleToggleGenre = useCallback((genre: Genre) => {
    try {
      if (!genre) {
        logger.warn('Invalid genre');
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
          logger.error('Error toggling genre:', { error });
          return current;
        }
      });
    } catch (error) {
      logger.error('Error in handleToggleGenre:', { error });
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    try {
      setSelectedGenres([]);
    } catch (error) {
      logger.error('Error clearing filters:', { error });
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
        logger.error('Error computing genre chart positions:', { error });
      }

      return positions;
    } catch (error) {
      logger.error('Error getting all chart positions:', { error });
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
      logger.error('Error navigating to chart:', { error });
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
      logger.error('Error navigating to next track:', error);
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
      logger.error('Error navigating to previous track:', error);
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
                  logger.error('Error navigating:', error);
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
                        logger.error('Error changing genre:', error);
                      }
                    }}
                    className="mb-0"
                  />
                </ErrorBoundary>
              </>
            )}

            <main id="main-content" className="w-full px-4 md:px-8 py-8">
              <div className="mx-auto max-w-5xl">
                <ErrorBoundary level="component">
                  {currentView === 'profile' && <ProfileView />}
                  {currentView === 'about' && <AboutView />}
                  {currentView === 'custom-charts' && <CustomChartsView />}
                  {currentView === 'privacy' && <PrivacyPolicyView />}
                  {currentView === 'terms' && <TermsOfServiceView />}
                  {currentView === 'imprint' && <ImprintView />}
                  {currentView.startsWith('admin') && (
                    <AdminLayout currentView={currentView} onNavigate={setCurrentView}>
                      {currentView === 'admin' && (
                        <div className="space-y-6">
                          <AdminArtistManagement />
                          <ArtistDatabaseManager />
                        </div>
                      )}
                      {currentView === 'admin-metrics' && <DashboardMetricsContainer />}
                      {currentView === 'admin-users' && <UserManagementContainer />}
                      {currentView === 'admin-artists' && <ArtistBlacklistContainer />}
                      {currentView === 'admin-charts' && <ChartControlContainer />}
                      {currentView === 'admin-promotions' && <PromotionApprovalContainer />}
                      {currentView === 'admin-settings' && <SystemSettingsContainer />}
                    </AdminLayout>
                  )}
                  {currentView === 'profiles-demo' && <ProfilesDemo />}
                  {currentView === 'voting' && (
                    <VotingArea
                      allTracks={[...(fanCharts || []), ...(expertCharts || []), ...(streamingCharts || [])]}
                      onTrackClick={handleTrackClick}
                      onVoteComplete={() => {
                        setHasVoted(true);
                        setCurrentView('voting-confirmation');
                      }}
                    />
                  )}
                  {currentView === 'voting-confirmation' && (
                    <VoteConfirmationView onNavigate={setCurrentView} />
                  )}
                  {currentView === 'history' && <ChartHistoryView />}
                {currentView === 'archive' && (
                  <div className="space-y-8">
                    {activePromotion && hasVoted && (
                      <PromotionalSlot
                        type={activePromotion.type}
                        name={activePromotion.name}
                        imageUrl={activePromotion.imageUrl}
                      />
                    )}
                    <ChartArchiveView />
                  </div>
                )}
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
                    {activePromotion && hasVoted && (
                      <PromotionalSlot type={activePromotion.type} name={activePromotion.name} imageUrl={activePromotion.imageUrl} />
                    )}
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
                        <div className="mx-auto max-w-5xl">
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
              logger.error('Error closing modal:', error);
            }
          }}
          allChartPositions={selectedTrackForModal ? getAllChartPositions(selectedTrackForModal) : []}
          onNavigateToChart={handleNavigateToChart}
        />
      </ErrorBoundary>

      <CookieConsentBanner onNavigateToPrivacy={() => setCurrentView('privacy')} />
        </>
      )}
    </div>
  );
}

export default AppContent;
