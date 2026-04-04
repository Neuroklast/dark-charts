import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DJProfile, Genre } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Microphone,
  TrendUp,
  CheckCircle,
  Crown,
  SpotifyLogo,
  AppleLogo,
  YoutubeLogo,
  InstagramLogo,
  TwitterLogo,
  GlobeHemisphereWest,
  MusicNotes,
  ChartLine
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface DJProfileDrawerProps {
  profile: DJProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DJProfileDrawer({ profile, isOpen, onClose }: DJProfileDrawerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [topGenres, setTopGenres] = useState<{ genre: string; accuracy: number }[]>([]);

  useEffect(() => {
    if (isOpen && profile) {
      setIsLoading(true);
      setTimeout(() => {
        generateTopGenres();
        setIsLoading(false);
      }, 800);
    }
  }, [isOpen, profile]);

  const generateTopGenres = () => {
    const genres = [
      'Dark Wave',
      'Gothic Metal',
      'EBM',
      'Industrial',
      'Doom Metal'
    ];
    
    const topGenreData = genres.slice(0, 5).map((genre, index) => ({
      genre,
      accuracy: 95 - (index * 5) + Math.random() * 5
    }));

    setTopGenres(topGenreData);
  };

  const getPlatformIcon = (platform: string) => {
    const normalizedPlatform = platform.toLowerCase();
    if (normalizedPlatform.includes('spotify')) return <SpotifyLogo weight="fill" className="w-4 h-4" />;
    if (normalizedPlatform.includes('apple')) return <AppleLogo weight="fill" className="w-4 h-4" />;
    if (normalizedPlatform.includes('youtube')) return <YoutubeLogo weight="fill" className="w-4 h-4" />;
    if (normalizedPlatform.includes('instagram')) return <InstagramLogo weight="fill" className="w-4 h-4" />;
    if (normalizedPlatform.includes('twitter') || normalizedPlatform.includes('x.com')) return <TwitterLogo weight="fill" className="w-4 h-4" />;
    if (normalizedPlatform.includes('website') || normalizedPlatform.includes('mixcloud')) return <GlobeHemisphereWest weight="fill" className="w-4 h-4" />;
    return <GlobeHemisphereWest weight="fill" className="w-4 h-4" />;
  };

  if (!profile) return null;

  const reputationPercentage = (profile.reputation / 100) * 100;
  const expertWeight = profile.expertWeight || 1.0;
  const earlySupported = profile.supportedTracks?.slice(0, 5) || [];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-background border-l border-accent" side="right">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="w-20 h-20 object-cover border-2 border-accent"
                />
              ) : (
                <div className="w-20 h-20 bg-secondary border-2 border-accent flex items-center justify-center">
                  <span className="display-font text-2xl text-muted-foreground">
                    {profile.username.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-accent p-1.5 shadow-lg">
                <Crown weight="fill" className="w-4 h-4 text-background" />
              </div>
            </div>
            <div className="flex-1">
              <SheetTitle className="display-font text-2xl uppercase tracking-tight text-foreground mb-1">
                {profile.username}
              </SheetTitle>
              <div className="flex items-center gap-2 mb-2">
                <BadgeUI variant="outline" className="font-ui text-[10px] uppercase tracking-widest border-accent text-accent">
                  DJ / Curator
                </BadgeUI>
              </div>
              {profile.biography && (
                <p className="font-ui text-xs text-muted-foreground leading-relaxed">
                  {profile.biography}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <Card className="bg-card border border-accent p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ChartLine weight="duotone" className="w-5 h-5 text-accent" />
                <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Reputation Score</h3>
              </div>
              <span className="data-font text-2xl font-bold text-accent">
                {profile.reputation}/100
              </span>
            </div>
            <Progress value={reputationPercentage} className="h-3 mb-3" />
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              <div>
                <p className="font-ui text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Expert Weight
                </p>
                <p className="data-font text-lg font-bold text-foreground">
                  {expertWeight.toFixed(2)}x
                </p>
              </div>
              <div>
                <p className="font-ui text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  References
                </p>
                <p className="data-font text-lg font-bold text-foreground">
                  {profile.references?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendUp weight="duotone" className="w-5 h-5 text-accent" />
              <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Track Record</h3>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-secondary/50 animate-pulse border border-border" />
                ))}
              </div>
            ) : earlySupported.length > 0 ? (
              <Card className="bg-secondary border border-border p-4">
                <p className="font-ui text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                  Early supporters of these tracks before Top 10 entry
                </p>
                <div className="space-y-2">
                  {earlySupported.map((trackId, index) => (
                    <motion.div
                      key={trackId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 p-2 bg-background border border-border hover:border-accent transition-colors"
                    >
                      <CheckCircle weight="fill" className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="font-ui text-xs text-foreground flex-1">
                        Track #{trackId}
                      </span>
                      <BadgeUI variant="outline" className="text-[9px] uppercase tracking-widest">
                        Early
                      </BadgeUI>
                    </motion.div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="bg-secondary/30 border border-border p-6 text-center">
                <TrendUp weight="duotone" className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-40" />
                <p className="font-ui text-xs text-muted-foreground uppercase tracking-widest">
                  No Early Predictions Yet
                </p>
              </Card>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <MusicNotes weight="duotone" className="w-5 h-5 text-accent" />
              <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Top Subgenres</h3>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-4 w-32 bg-secondary/50 animate-pulse" />
                    <div className="h-2 bg-secondary/50 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="bg-secondary border border-border p-4">
                <p className="font-ui text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                  Genre accuracy based on voting history
                </p>
                <div className="space-y-3">
                  {topGenres.map((item, index) => (
                    <motion.div
                      key={item.genre}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-ui text-xs text-foreground uppercase tracking-wider">
                          {item.genre}
                        </span>
                        <span className="data-font text-sm font-bold text-accent">
                          {item.accuracy.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={item.accuracy} className="h-1.5" />
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {profile.curatedPlaylists && profile.curatedPlaylists.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Microphone weight="duotone" className="w-5 h-5 text-accent" />
                <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Curated Playlists</h3>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-16 bg-secondary/50 animate-pulse border border-border" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.curatedPlaylists.slice(0, 5).map((playlist, index) => (
                    <motion.div
                      key={playlist.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-secondary border border-border p-3 hover:border-accent transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-ui text-sm text-foreground font-semibold uppercase tracking-wide">
                              {playlist.name}
                            </p>
                            <p className="data-font text-xs text-muted-foreground">
                              {playlist.trackIds.length} tracks · Created {new Date(playlist.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <MusicNotes weight="duotone" className="w-5 h-5 text-accent" />
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {profile.externalLinks && profile.externalLinks.length > 0 && (
            <div>
              <h3 className="display-font text-sm uppercase tracking-tight text-foreground mb-3">Social Links</h3>
              <div className="flex flex-wrap gap-2">
                {profile.externalLinks.map((link, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="border-border hover:border-accent"
                    asChild
                  >
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      {getPlatformIcon(link.platform)}
                      <span className="font-ui text-xs uppercase tracking-wider">{link.platform}</span>
                      {link.verified && <CheckCircle weight="fill" className="w-3 h-3 text-accent" />}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <p className="data-font text-[9px] text-muted-foreground uppercase tracking-widest">
              Curator since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
