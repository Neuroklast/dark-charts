import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Track, MainGenre, Genre, ChartType } from '@/types';
import { 
  X, Play, CaretUp, CaretDown, Info, ArrowRight, 
  SpotifyLogo, AppleLogo, YoutubeLogo, AmazonLogo,
  SoundcloudLogo, TidalLogo, MusicNote, Users, ShareFat
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { audioPlayerService } from '@/services/audioPlayerService';
import { useTrackData } from '@/hooks/use-track-data';
import { TrackShareCard } from '@/components/TrackShareCard';
import { toBlob } from 'html-to-image';
import { toast } from 'sonner';

interface ChartPosition {
  chartName: string;
  position: number;
  chartType?: ChartType;
  mainGenre?: MainGenre;
  subGenre?: Genre;
}

interface TrackDetailModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onVote?: (trackId: string, direction: 'up' | 'down') => void;
  userVote?: 'up' | 'down' | null;
  allChartPositions?: ChartPosition[];
  onNavigateToChart?: (chartType?: ChartType, mainGenre?: MainGenre, subGenre?: Genre) => void;
}

export function TrackDetailModal({ track, isOpen, onClose, onVote, userVote, allChartPositions = [], onNavigateToChart }: TrackDetailModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [artworkLoaded, setArtworkLoaded] = useState(false);
  const [spotifyLoaded, setSpotifyLoaded] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const {
    enrichedTrack,
    isLoadingArtwork,
    isLoadingPreview,
    isLoadingStreamingLinks,
    artworkUrl,
    previewUrl,
    hasStreamingLinks
  } = useTrackData(isOpen ? track : null);

  useEffect(() => {
    if (!isOpen || !artworkUrl) {
      setArtworkLoaded(false);
      return;
    }

    const img = new Image();
    img.onload = () => setArtworkLoaded(true);
    img.onerror = () => setArtworkLoaded(true);
    img.src = artworkUrl;
  }, [artworkUrl, isOpen]);

  useEffect(() => {
    if (audioRef.current) {
      audioPlayerService.registerAudioElement(audioRef.current);
    }
  }, []);

  useEffect(() => {
    if (iframeRef.current && isOpen) {
      audioPlayerService.registerIframe(iframeRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      audioPlayerService.stopAll();
      setSpotifyLoaded(false);
    }
  }, [isOpen]);

  if (!track) return null;

  const getSpotifyEmbedId = (uri?: string): string | null => {
    if (!uri) return null;
    const match = uri.match(/spotify:track:(.+)/);
    return match ? match[1] : null;
  };

  const spotifyId = getSpotifyEmbedId(track.spotifyUri);

  const handleChartClick = (position: ChartPosition) => {
    if (onNavigateToChart) {
      onNavigateToChart(position.chartType, position.mainGenre, position.subGenre);
      onClose();
    }
  };

  const handleSharePlacements = async () => {
    if (!shareCardRef.current || !track) return;

    if (!artworkUrl) {
      toast.error('Share image is still loading. Please try again in a moment.');
      return;
    }

    setIsGeneratingImage(true);

    const sanitizeFilename = (str: string) => str.replace(/[/\\:*?"<>|]/g, '-');

    try {
      const blob = await toBlob(shareCardRef.current, {
        quality: 1,
        pixelRatio: 2,
        useCORS: true,
        cacheBust: true,
        backgroundColor: '#000000',
      });

      if (!blob) {
        throw new Error('Failed to generate image');
      }

      const safeArtist = sanitizeFilename(track.artist);
      const safeTitle = sanitizeFilename(track.title);
      const filename = `dark-charts-${safeArtist}-${safeTitle}.png`;

      const file = new File([blob], filename, {
        type: 'image/png',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${track.title} - ${track.artist} on Dark Charts`,
          text: `Check out ${track.title} by ${track.artist} on Dark Charts!`,
        });
        toast.success('Chart positions shared successfully!');
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Image downloaded successfully!');
      }
    } catch (error) {
      console.error('Failed to share chart positions:', error);
      toast.error('Failed to generate share image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const getPlatformIcon = (platformName: string) => {
    const name = platformName.toLowerCase();
    const iconProps = { size: 20, weight: "fill" as const };
    
    if (name.includes('spotify')) return <SpotifyLogo {...iconProps} />;
    if (name.includes('apple') || name.includes('itunes')) return <AppleLogo {...iconProps} />;
    if (name.includes('youtube')) return <YoutubeLogo {...iconProps} />;
    if (name.includes('amazon')) return <AmazonLogo {...iconProps} />;
    if (name.includes('soundcloud')) return <SoundcloudLogo {...iconProps} />;
    if (name.includes('tidal')) return <TidalLogo {...iconProps} />;
    
    return <MusicNote {...iconProps} />;
  };

  const getStreamingLinks = () => {
    const links: Array<{ platform: string; url: string; available: boolean }> = [];

    const currentTrack = enrichedTrack || track;
    if (currentTrack.odesliData?.linksByPlatform) {
      const platforms = currentTrack.odesliData.linksByPlatform;
      
      const platformMapping: Record<string, string> = {
        spotify: 'Spotify',
        appleMusic: 'Apple Music',
        itunes: 'iTunes',
        youtube: 'YouTube',
        youtubeMusic: 'YouTube Music',
        google: 'Google Play',
        googleStore: 'Google Store',
        pandora: 'Pandora',
        deezer: 'Deezer',
        tidal: 'Tidal',
        amazonStore: 'Amazon',
        amazonMusic: 'Amazon Music',
        soundcloud: 'SoundCloud',
        napster: 'Napster',
        yandex: 'Yandex Music',
        spinrilla: 'Spinrilla',
        audius: 'Audius',
        audiomack: 'Audiomack',
        anghami: 'Anghami',
        boomplay: 'Boomplay',
        bandcamp: 'Bandcamp'
      };

      Object.entries(platforms).forEach(([key, value]) => {
        if (value && value.url) {
          const platformName = platformMapping[key] || key.charAt(0).toUpperCase() + key.slice(1);
          links.push({ 
            platform: platformName, 
            url: value.url, 
            available: true 
          });
        }
      });
    } else {
      if (currentTrack.spotifyUri && spotifyId) {
        links.push({ platform: 'Spotify', url: `https://open.spotify.com/track/${spotifyId}`, available: true });
      }
      if (currentTrack.appleMusicUrl) {
        links.push({ platform: 'Apple Music', url: currentTrack.appleMusicUrl, available: true });
      }
      if (currentTrack.amazonMusicUrl) {
        links.push({ platform: 'Amazon Music', url: currentTrack.amazonMusicUrl, available: true });
      }
      if (currentTrack.youtubeUrl) {
        links.push({ platform: 'YouTube', url: currentTrack.youtubeUrl, available: true });
      }
    }

    return links;
  };

  const streamingLinks = getStreamingLinks();

  return (
    <TooltipProvider>
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
            onClick={onClose}
          />
          
          <div className="fixed inset-0 z-[101] overflow-y-auto pointer-events-none">
            <div className="min-h-screen px-4 flex items-center justify-center py-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="cyber-card w-full max-w-4xl pointer-events-auto relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="cyber-scanline" />
                
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 p-2 bg-background/80 border border-border hover:border-primary transition-colors"
                  aria-label="Close"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>

                <div className="p-6 md:p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="aspect-square w-full bg-muted relative overflow-hidden group">
                        {artworkUrl ? (
                          <>
                            {!artworkLoaded && (
                              <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
                                <Play size={64} className="text-muted-foreground/30" weight="fill" />
                              </div>
                            )}
                            <img
                              src={artworkUrl}
                              alt={`${track.title} by ${track.artist}`}
                              className={`w-full h-full object-cover transition-all duration-300 ${
                                artworkLoaded ? 'opacity-100 group-hover:scale-105' : 'opacity-0'
                              }`}
                              onLoad={() => setArtworkLoaded(true)}
                            />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play size={64} className="text-muted-foreground" weight="fill" />
                          </div>
                        )}
                      </div>

                      {onVote && (
                        <div className="flex items-center gap-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => onVote(track.id, 'up')}
                                variant={userVote === 'up' ? 'default' : 'outline'}
                                size="lg"
                                className="flex-1 font-ui uppercase tracking-wider"
                              >
                                <CaretUp size={20} weight="bold" className="mr-2" />
                                Vote Up
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-ui text-xs">Increase this track's chart position</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => onVote(track.id, 'down')}
                                variant={userVote === 'down' ? 'destructive' : 'outline'}
                                size="lg"
                                className="flex-1 font-ui uppercase tracking-wider"
                              >
                                <CaretDown size={20} weight="bold" className="mr-2" />
                                Vote Down
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-ui text-xs">Decrease this track's chart position</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      {track.votes !== undefined && (
                        <div className="p-4 bg-secondary/50 border border-border">
                          <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-1">
                            Current Votes
                          </div>
                          <div className="text-3xl font-display text-primary data-font">
                            {track.votes.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground">
                            Current Chart Position
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={14} className="text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-ui text-xs">Position in the current chart view</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-6xl font-display text-primary mb-4 data-font">
                          #{track.rank}
                        </div>
                      </div>

                      {allChartPositions.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground">
                              All Chart Positions
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info size={14} className="text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-ui text-xs">Click to navigate to any chart where this track appears</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto scrollbar-hide">
                            {allChartPositions.map((position, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleChartClick(position)}
                                className="flex items-center justify-between p-3 bg-secondary/30 border border-border hover:border-foreground hover:shadow-[0_0_8px_rgba(255,255,255,0.15)] transition-all group"
                              >
                                <span className="font-ui text-xs uppercase tracking-wider text-foreground text-left flex-1">
                                  {position.chartName}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-display text-lg text-primary data-font">
                                    #{position.position}
                                  </span>
                                  <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                              </button>
                            ))}
                          </div>
                          <Button
                            onClick={handleSharePlacements}
                            disabled={isGeneratingImage}
                            className="w-full mt-3 font-ui uppercase tracking-wider"
                            variant="outline"
                          >
                            {isGeneratingImage ? (
                              <>
                                <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin mr-2" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <ShareFat size={18} weight="fill" className="mr-2" />
                                Share Placements
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {track.topSupporters && track.topSupporters.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-border">
                          <div className="flex items-center gap-2">
                            <Users weight="duotone" className="w-4 h-4 text-accent" />
                            <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground">
                              Top Supporters
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {track.topSupporters.slice(0, 3).map((supporter) => (
                              <Tooltip key={supporter.userId}>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center gap-2 group cursor-pointer">
                                    <Avatar className="w-12 h-12 border-2 border-border group-hover:border-accent transition-colors">
                                      {supporter.avatarUrl ? (
                                        <AvatarImage src={supporter.avatarUrl} alt={supporter.username} />
                                      ) : (
                                        <AvatarFallback className="bg-secondary text-foreground font-display text-sm">
                                          {supporter.username.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                    <div className="text-center">
                                      <p className="font-ui text-[10px] text-foreground uppercase tracking-wider">
                                        {supporter.username}
                                      </p>
                                      <p className="font-ui text-[9px] text-muted-foreground uppercase tracking-widest">
                                        {supporter.userType === 'fan' ? 'Fan' : 'DJ'}
                                      </p>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-ui text-xs">{supporter.voteCount} votes</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h2 className="text-3xl md:text-4xl font-display uppercase tracking-tight text-foreground mb-2 leading-tight">
                          {track.title}
                        </h2>
                        <button
                          onClick={() => {
                            toast.info('Artist profile feature coming soon!');
                          }}
                          className="text-xl text-muted-foreground font-ui hover:text-primary transition-colors text-left group inline-flex items-center gap-2"
                        >
                          <span className="group-hover:underline">{track.artist}</span>
                          <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </div>

                      {track.album && (
                        <div>
                          <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-1">
                            Album
                          </div>
                          <div className="text-base text-foreground font-ui">
                            {track.album}
                          </div>
                        </div>
                      )}

                      {track.releaseDate && (
                        <div>
                          <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-1">
                            Release Date
                          </div>
                          <div className="text-base text-foreground font-ui data-font">
                            {track.releaseDate}
                          </div>
                        </div>
                      )}

                      {track.label && (
                        <div>
                          <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-1">
                            Label
                          </div>
                          <div className="text-base text-foreground font-ui">
                            {track.label}
                          </div>
                        </div>
                      )}

                      {track.genres.length > 0 && (
                        <div>
                          <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-2">
                            Genres
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {track.genres.map((genre) => (
                              <Badge
                                key={genre}
                                variant="outline"
                                className="font-ui text-xs uppercase tracking-wider"
                              >
                                {genre}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {(track.previewUrl || track.spotifyUri) && (
                    <div className="pt-4 border-t border-border">
                      <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-4">
                        Track Preview
                      </div>
                      {track.previewUrl ? (
                        <audio 
                          ref={audioRef}
                          controls 
                          className="w-full"
                          preload="metadata"
                        >
                          <source src={track.previewUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      ) : null}
                      {track.spotifyUri && spotifyId && (
                        <div className="mt-4 relative">
                          {!spotifyLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 border border-border animate-pulse">
                              <div className="text-xs text-muted-foreground font-ui">Loading Spotify Player...</div>
                            </div>
                          )}
                          <iframe
                            ref={iframeRef}
                            src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
                            width="100%"
                            height="152"
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="eager"
                            title={`${track.artist} - ${track.title}`}
                            className="border border-border"
                            onLoad={() => setSpotifyLoaded(true)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {streamingLinks.length > 0 ? (
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground">
                          Höre auf / Listen On
                        </div>
                        <div className="text-xs font-ui text-muted-foreground data-font">
                          {streamingLinks.length} {streamingLinks.length === 1 ? 'Platform' : 'Platforms'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {streamingLinks.map((link) => (
                          <a
                            key={link.platform}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-secondary/50 border border-border hover:border-foreground hover:shadow-[0_0_8px_rgba(255,255,255,0.15)] transition-all flex flex-col items-center justify-center gap-2 text-center font-ui text-[10px] uppercase tracking-wider group min-h-[80px]"
                          >
                            <div className="text-muted-foreground group-hover:text-primary transition-colors">
                              {getPlatformIcon(link.platform)}
                            </div>
                            <span className="group-hover:text-primary transition-colors leading-tight">
                              {link.platform}
                            </span>
                          </a>
                        ))}
                      </div>
                      {track.odesliData?.pageUrl && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <a
                            href={track.odesliData.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-ui text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider inline-flex items-center gap-2 group"
                          >
                            <span>Mehr Streaming-Optionen / More Streaming Options</span>
                            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-border">
                      <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-3">
                        Streaming-Verfügbarkeit / Streaming Availability
                      </div>
                      <div className="p-4 bg-secondary/30 border border-border/50">
                        <p className="text-sm font-ui text-muted-foreground text-center">
                          Streaming-Links werden geladen... / Loading streaming links...
                        </p>
                        <p className="text-xs font-ui text-muted-foreground/70 text-center mt-2">
                          Falls keine Links angezeigt werden, ist dieser Track möglicherweise nicht auf Streaming-Plattformen verfügbar.
                          / If no links appear, this track may not be available on streaming platforms.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-4">
                      Artist Links
                    </div>
                    <div className="p-4 bg-secondary/30 border border-border/50">
                      <p className="text-sm font-ui text-muted-foreground text-center">
                        Artist social links coming soon...
                      </p>
                      <p className="text-xs font-ui text-muted-foreground/70 text-center mt-2">
                        Instagram, Website, Spotify, and more will be available here.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <div
            ref={shareCardRef}
            className="fixed pointer-events-none"
            style={{
              position: 'fixed',
              left: '-9999px',
              top: '-9999px',
              zIndex: -1,
            }}
          >
            {track && artworkUrl && (
              <TrackShareCard
                track={track}
                artworkUrl={artworkUrl}
                chartPositions={allChartPositions}
              />
            )}
          </div>
        </>
      )}
    </AnimatePresence>
    </TooltipProvider>
  );
}
