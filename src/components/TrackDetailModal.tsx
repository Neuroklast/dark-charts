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

export function TrackDetailModal({ 
  track, 
  isOpen, 
  onClose, 
  onVote, 
  userVote, 
  allChartPositions = [], 
  onNavigateToChart 
}: TrackDetailModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [artworkLoaded, setArtworkLoaded] = useState(false);
  const [spotifyLoaded, setSpotifyLoaded] = useState(false);
  
  const {
    enrichedTrack,
    artworkUrl
  } = useTrackData(isOpen ? track : null);
  
  const spotifyId = enrichedTrack?.spotifyId || track?.spotifyId || null;

  // Artwork loading logic with CORS support
  useEffect(() => {
    if (!isOpen || !artworkUrl) {
      setArtworkLoaded(false);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setArtworkLoaded(true);
    img.src = artworkUrl;
  }, [artworkUrl, isOpen]);

  // Audio & Iframe Registration
  useEffect(() => {
    if (audioRef.current && isOpen) {
      audioPlayerService.registerAudioElement(audioRef.current);
    }
    if (iframeRef.current && isOpen) {
      audioPlayerService.registerIframe(iframeRef.current);
    }
    return () => {
      if (!isOpen) audioPlayerService.stopAll();
    };
  }, [isOpen]);

  if (!track) return null;

  const streamingLinks = getStreamingLinks(enrichedTrack || track, spotifyId);

  return (
    <TooltipProvider>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
              onClick={onClose}
            />
            
            <div className="fixed inset-0 z-[101] overflow-y-auto pointer-events-none flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="cyber-card w-full max-w-4xl pointer-events-auto relative bg-background border border-border overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
                  {/* Left Column: Artwork & Voting */}
                  <div className="space-y-6">
                    <div className="aspect-square bg-muted relative border border-border group overflow-hidden">
                      {artworkUrl && (
                        <img
                          src={artworkUrl}
                          crossOrigin="anonymous"
                          alt={track.title}
                          className={`w-full h-full object-cover transition-opacity duration-300 ${artworkLoaded ? 'opacity-100' : 'opacity-0'}`}
                          onLoad={() => setArtworkLoaded(true)}
                        />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        variant={userVote === 'up' ? 'default' : 'outline'}
                        onClick={() => onVote?.(track.id, 'up')}
                      >
                        <CaretUp weight="bold" className="mr-2" /> Vote Up
                      </Button>
                      <Button 
                        className="flex-1" 
                        variant={userVote === 'down' ? 'destructive' : 'outline'}
                        onClick={() => onVote?.(track.id, 'down')}
                      >
                        <CaretDown weight="bold" className="mr-2" /> Vote Down
                      </Button>
                    </div>
                  </div>

                  {/* Right Column: Info & Links */}
                  <div className="space-y-6 text-left">
                    <div>
                      <h2 className="text-4xl font-display uppercase tracking-tighter">{track.title}</h2>
                      <p className="text-xl text-muted-foreground">{track.artist}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Rank</p>
                        <p className="text-4xl font-display text-primary">#{track.rank}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Votes</p>
                        <p className="text-4xl font-display">{track.votes || 0}</p>
                      </div>
                    </div>

                    {allChartPositions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Placements</p>
                        <div className="flex flex-wrap gap-2">
                          {allChartPositions.map((pos, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] py-0.5">
                              {pos.chartName}: #{pos.position}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {track.album && (
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Album</p>
                            <p className="font-ui">{track.album}</p>
                          </div>
                        )}
                        {track.releaseDate && (
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Release Date</p>
                            <p className="font-ui">{track.releaseDate}</p>
                          </div>
                        )}
                        {track.label && (
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Label</p>
                            <p className="font-ui">{track.label}</p>
                          </div>
                        )}
                      </div>

                      {track.genres && track.genres.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Genres</p>
                          <div className="flex flex-wrap gap-2">
                            {track.genres.map((genre) => (
                              <Badge key={genre} variant="secondary" className="text-[10px]">
                                {genre}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {(track.previewUrl || track.spotifyUri) && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Track Preview</p>
                        {track.previewUrl ? (
                          <audio
                            ref={audioRef}
                            controls
                            className="w-full h-10"
                            preload="metadata"
                          >
                            <source src={track.previewUrl} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        ) : null}
                      </div>
                    )}

                    <div className="space-y-4">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Listen On</p>
                      <div className="grid grid-cols-4 gap-2">
                        {streamingLinks.map((link) => (
                          <a 
                            key={link.platform} 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex flex-col items-center p-2 bg-secondary/20 hover:bg-primary/20 border border-border transition-colors"
                          >
                            {getPlatformIcon(link.platform)}
                            <span className="text-[8px] mt-1 uppercase">{link.platform}</span>
                          </a>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Artist Links</p>
                      {track.odesliData?.pageUrl ? (
                        <a
                          href={track.odesliData.pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 inline-flex"
                        >
                          More Streaming Options <ArrowRight size={14} />
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No additional links available.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Spotify Embed */}
                {spotifyId && (
                  <div className="px-8 pb-8">
                    <iframe
                      ref={iframeRef}
                      src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
                      width="100%"
                      height="80"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      onLoad={() => setSpotifyLoaded(true)}
                      className="rounded-lg border border-border"
                    />
                  </div>
                )}
                
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-accent rounded-full">
                  <X size={20} />
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}

// Helper Functions
function getStreamingLinks(track: any, spotifyId?: string | null) {
  const links: any[] = [];
  if (spotifyId) links.push({ platform: 'Spotify', url: `https://open.spotify.com/track/${spotifyId}` });
  if (track.appleMusicUrl) links.push({ platform: 'Apple', url: track.appleMusicUrl });
  if (track.youtubeUrl) links.push({ platform: 'YouTube', url: track.youtubeUrl });
  return links;
}

function getPlatformIcon(platform: string) {
  if (platform === 'Spotify') return <SpotifyLogo weight="fill" size={20} />;
  if (platform === 'Apple') return <AppleLogo weight="fill" size={20} />;
  if (platform === 'YouTube') return <YoutubeLogo weight="fill" size={20} />;
  return <MusicNote size={20} />;
}