import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BandProfile, Genre, ChartType } from '@/types';
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
  MusicNotes,
  TrendUp,
  CheckCircle,
  MapPin,
  CalendarBlank,
  Vinyl,
  SpotifyLogo,
  AppleLogo,
  YoutubeLogo,
  InstagramLogo,
  TwitterLogo,
  GlobeHemisphereWest,
  Buildings
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { SafeImage } from '@/components/SafeImage';

interface ArtistProfileDrawerProps {
  profile: BandProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ArtistProfileDrawer({ profile, isOpen, onClose }: ArtistProfileDrawerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && profile) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    }
  }, [isOpen, profile]);

  const getPlatformIcon = (platform: string) => {
    const normalizedPlatform = platform.toLowerCase();
    if (normalizedPlatform.includes('spotify')) return <SpotifyLogo weight="fill" className="w-5 h-5" />;
    if (normalizedPlatform.includes('apple')) return <AppleLogo weight="fill" className="w-5 h-5" />;
    if (normalizedPlatform.includes('youtube')) return <YoutubeLogo weight="fill" className="w-5 h-5" />;
    if (normalizedPlatform.includes('instagram')) return <InstagramLogo weight="fill" className="w-5 h-5" />;
    if (normalizedPlatform.includes('twitter') || normalizedPlatform.includes('x.com')) return <TwitterLogo weight="fill" className="w-5 h-5" />;
    if (normalizedPlatform.includes('website') || normalizedPlatform.includes('bandcamp')) return <GlobeHemisphereWest weight="fill" className="w-5 h-5" />;
    return <GlobeHemisphereWest weight="fill" className="w-5 h-5" />;
  };

  if (!profile) return null;

  const genresByPopularity = [...(profile.genres || [])].sort(() => Math.random() - 0.5);
  const currentPosition = profile.analytics?.chartPositions?.[0]?.position;
  const bestPosition = profile.analytics?.chartPositions
    ? Math.min(...profile.analytics.chartPositions.map(p => p.position))
    : undefined;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-background border-l border-accent p-0" side="right">
        <div className="relative h-48 bg-gradient-to-br from-primary/20 via-secondary to-accent/20 overflow-hidden">
          <div 
            className="absolute inset-0 opacity-30" 
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, var(--border) 10px, var(--border) 20px)`
            }}
          />
          {profile.avatarUrl && (
            <div className="absolute inset-0 opacity-40">
              <SafeImage
                src={profile.avatarUrl}
                alt={profile.username}
                width={800}
                height={192}
                className="w-full h-full object-cover"
                priority={true}
              />
            </div>
          )}
        </div>

        <div className="px-6 -mt-16 relative z-10">
          <div className="flex items-end gap-4 mb-6">
            <div className="relative">
              {profile.avatarUrl ? (
                <div className="border-4 border-background shadow-lg overflow-hidden">
                  <SafeImage
                    src={profile.avatarUrl}
                    alt={profile.username}
                    width={128}
                    height={128}
                    className="object-cover"
                    priority={true}
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-secondary border-4 border-background shadow-lg flex items-center justify-center">
                  <span className="display-font text-4xl text-muted-foreground">
                    {profile.username.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              {profile.isPremium && (
                <div className="absolute -bottom-2 -right-2 bg-accent p-2 shadow-lg">
                  <CheckCircle weight="fill" className="w-6 h-6 text-background" />
                </div>
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="display-font text-3xl uppercase tracking-tight text-foreground">
                  {profile.username}
                </h1>
                {profile.isPremium && (
                  <BadgeUI variant="default" className="bg-accent text-background font-ui text-[10px] uppercase tracking-widest">
                    Verified
                  </BadgeUI>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <BadgeUI variant="outline" className="font-ui text-[10px] uppercase tracking-widest border-accent text-accent">
                  Artist
                </BadgeUI>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 space-y-6 pb-6">
          {profile.biography && (
            <div>
              <p className="font-ui text-sm text-foreground leading-relaxed">
                {profile.biography}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {currentPosition && (
              <Card className="bg-card border border-border p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendUp weight="duotone" className="w-4 h-4 text-accent" />
                  <span className="font-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                    Current Position
                  </span>
                </div>
                <p className="data-font text-2xl font-bold text-foreground">
                  #{currentPosition}
                </p>
              </Card>
            )}
            {bestPosition && (
              <Card className="bg-card border border-border p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle weight="duotone" className="w-4 h-4 text-accent" />
                  <span className="font-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                    Peak Position
                  </span>
                </div>
                <p className="data-font text-2xl font-bold text-foreground">
                  #{bestPosition}
                </p>
              </Card>
            )}
          </div>

          {profile.genres && profile.genres.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MusicNotes weight="duotone" className="w-5 h-5 text-accent" />
                <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Genre Tag Cloud</h3>
              </div>

              {isLoading ? (
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-7 w-24 bg-secondary/50 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {genresByPopularity.map((genre, index) => {
                    const sizes = ['text-base', 'text-sm', 'text-xs', 'text-xs', 'text-[11px]'];
                    const size = sizes[Math.min(index, sizes.length - 1)];
                    return (
                      <motion.div
                        key={genre}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <BadgeUI 
                          variant="outline" 
                          className={cn(
                            'font-ui uppercase tracking-wider border-border hover:border-accent transition-colors cursor-pointer',
                            size
                          )}
                        >
                          {genre}
                        </BadgeUI>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {profile.latestReleases && profile.latestReleases.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Vinyl weight="duotone" className="w-5 h-5 text-accent" />
                <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Latest Releases</h3>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-16 bg-secondary/50 animate-pulse border border-border" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.latestReleases.slice(0, 3).map((release, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-secondary border border-border p-3 hover:border-accent transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-ui text-sm text-foreground font-semibold">
                              {release.title}
                            </p>
                            <p className="data-font text-xs text-muted-foreground">
                              {new Date(release.releaseDate).toLocaleDateString()}
                            </p>
                          </div>
                          {release.spotifyUri && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`https://open.spotify.com/track/${release.spotifyUri.split(':')[2]}`} target="_blank" rel="noopener noreferrer">
                                <SpotifyLogo weight="fill" className="w-5 h-5 text-accent" />
                              </a>
                            </Button>
                          )}
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
              <h3 className="display-font text-sm uppercase tracking-tight text-foreground mb-3">Social & Streaming</h3>
              <div className="grid grid-cols-2 gap-2">
                {profile.externalLinks.map((link, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="border-border hover:border-accent justify-start"
                    asChild
                  >
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                      {getPlatformIcon(link.platform)}
                      <div className="flex-1 text-left">
                        <span className="font-ui text-xs uppercase tracking-wider">{link.platform}</span>
                        {link.verified && (
                          <CheckCircle weight="fill" className="inline-block w-3 h-3 ml-1 text-accent" />
                        )}
                      </div>
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {profile.analytics && (
            <Card className="bg-card border border-accent p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendUp weight="duotone" className="w-5 h-5 text-accent" />
                <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Performance Metrics</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-ui text-xs text-muted-foreground uppercase tracking-wider">Total Votes</span>
                  <span className="data-font text-lg font-bold text-foreground">{profile.analytics.totalVotes || 0}</span>
                </div>
                {profile.analytics.chartPositions && profile.analytics.chartPositions.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <span className="font-ui text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">Chart Positions</span>
                    <div className="space-y-1">
                      {profile.analytics.chartPositions.map((pos, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="font-ui text-xs text-foreground capitalize">{pos.chartType} Charts</span>
                          <span className="data-font text-sm font-semibold text-accent">#{pos.position}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          <div className="pt-4 border-t border-border">
            <p className="data-font text-[9px] text-muted-foreground uppercase tracking-widest">
              Profile created {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
