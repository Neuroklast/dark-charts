import { motion, AnimatePresence } from 'framer-motion';
import { Track } from '@/types';
import { X, Play, CaretUp, CaretDown } from '@phosphor-icons/react';
import { SpotifyEmbed } from '@/components/SpotifyEmbed';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TrackDetailModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onVote?: (trackId: string, direction: 'up' | 'down') => void;
  userVote?: 'up' | 'down' | null;
}

export function TrackDetailModal({ track, isOpen, onClose, onVote, userVote }: TrackDetailModalProps) {
  if (!track) return null;

  const getSpotifyEmbedId = (uri?: string): string | null => {
    if (!uri) return null;
    const match = uri.match(/spotify:track:(.+)/);
    return match ? match[1] : null;
  };

  const spotifyId = getSpotifyEmbedId(track.spotifyUri);

  return (
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
                        {track.albumArt ? (
                          <img
                            src={track.albumArt}
                            alt={`${track.title} by ${track.artist}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play size={64} className="text-muted-foreground" weight="fill" />
                          </div>
                        )}
                      </div>

                      {onVote && (
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={() => onVote(track.id, 'up')}
                            variant={userVote === 'up' ? 'default' : 'outline'}
                            size="lg"
                            className="flex-1 font-ui uppercase tracking-wider"
                          >
                            <CaretUp size={20} weight="bold" className="mr-2" />
                            Vote Up
                          </Button>
                          <Button
                            onClick={() => onVote(track.id, 'down')}
                            variant={userVote === 'down' ? 'destructive' : 'outline'}
                            size="lg"
                            className="flex-1 font-ui uppercase tracking-wider"
                          >
                            <CaretDown size={20} weight="bold" className="mr-2" />
                            Vote Down
                          </Button>
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
                        <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-2">
                          Chart Position
                        </div>
                        <div className="text-6xl font-display text-primary mb-4 data-font">
                          #{track.rank}
                        </div>
                      </div>

                      <div>
                        <h2 className="text-3xl md:text-4xl font-display uppercase tracking-tight text-foreground mb-2 leading-tight">
                          {track.title}
                        </h2>
                        <div className="text-xl text-muted-foreground font-ui">
                          {track.artist}
                        </div>
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

                  {track.spotifyUri && (
                    <div className="pt-4 border-t border-border">
                      <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-4">
                        Preview Player
                      </div>
                      <SpotifyEmbed 
                        spotifyUri={track.spotifyUri}
                        artist={track.artist}
                        title={track.title}
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <div className="text-xs font-ui uppercase tracking-[0.15em] text-muted-foreground mb-4">
                      Listen On
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {track.spotifyUri && (
                        <a
                          href={`https://open.spotify.com/track/${spotifyId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 bg-secondary border border-border hover:border-primary transition-all flex items-center justify-center gap-2 font-ui text-sm uppercase tracking-wider hover:bg-primary/10"
                        >
                          Spotify
                        </a>
                      )}
                      {track.appleMusicUrl && (
                        <a
                          href={track.appleMusicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 bg-secondary border border-border hover:border-primary transition-all flex items-center justify-center gap-2 font-ui text-sm uppercase tracking-wider hover:bg-primary/10"
                        >
                          Apple Music
                        </a>
                      )}
                      {track.amazonMusicUrl && (
                        <a
                          href={track.amazonMusicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 bg-secondary border border-border hover:border-primary transition-all flex items-center justify-center gap-2 font-ui text-sm uppercase tracking-wider hover:bg-primary/10"
                        >
                          Amazon Music
                        </a>
                      )}
                      {track.youtubeUrl && (
                        <a
                          href={track.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 bg-secondary border border-border hover:border-primary transition-all flex items-center justify-center gap-2 font-ui text-sm uppercase tracking-wider hover:bg-primary/10"
                        >
                          YouTube
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
