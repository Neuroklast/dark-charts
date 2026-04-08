import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FanProfile, Badge, Genre } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar } from '@/components/ui/avatar';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Coins,
  Trophy,
  Calendar,
  SpotifyLogo,
  AppleLogo,
  YoutubeLogo,
  InstagramLogo,
  TwitchLogo,
  X,
  CheckCircle,
  Eye,
  EyeSlash,
  ChartPolar,
  Flame,
  Star
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { SafeImage } from '@/components/SafeImage';
import { TasteProfileRadar } from '@/components/TasteProfileRadar';
import { JsonLdScript } from '@/components/JsonLdScript';

interface FanProfileDrawerProps {
  profile: FanProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile?: (updates: Partial<FanProfile>) => Promise<void>;
}

interface ContributionDay {
  date: Date;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export function FanProfileDrawer({ profile, isOpen, onClose, onUpdateProfile }: FanProfileDrawerProps) {
  const [contributionData, setContributionData] = useState<ContributionDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublicProfile, setIsPublicProfile] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setIsPublicProfile(profile.isPublicProfile || false);
    }
  }, [profile]);

  useEffect(() => {
    if (isOpen && profile) {
      setIsLoading(true);
      setTimeout(() => {
        generateContributionData();
        setIsLoading(false);
      }, 800);
    }
  }, [isOpen, profile]);

  const generateContributionData = () => {
    if (!profile) return;

    const days: ContributionDay[] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);

    const votingMap = new Map<string, number>();
    profile.votingHistory?.forEach(vote => {
      const date = new Date(vote.timestamp);
      const dateKey = date.toISOString().split('T')[0];
      votingMap.set(dateKey, (votingMap.get(dateKey) || 0) + 1);
    });

    for (let i = 0; i < 365; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];
      const count = votingMap.get(dateKey) || 0;

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count > 0) level = 1;
      if (count >= 3) level = 2;
      if (count >= 6) level = 3;
      if (count >= 10) level = 4;

      days.push({ date: currentDate, count, level });
    }

    setContributionData(days);
  };

  const getLevelColor = (level: number): string => {
    switch (level) {
      case 0: return 'bg-border';
      case 1: return 'bg-primary/30';
      case 2: return 'bg-primary/50';
      case 3: return 'bg-primary/75';
      case 4: return 'bg-primary';
      default: return 'bg-border';
    }
  };

  const getPlatformIcon = (platform: string) => {
    const normalizedPlatform = platform.toLowerCase();
    if (normalizedPlatform.includes('spotify')) return <SpotifyLogo weight="fill" className="w-4 h-4" />;
    if (normalizedPlatform.includes('apple')) return <AppleLogo weight="fill" className="w-4 h-4" />;
    if (normalizedPlatform.includes('youtube')) return <YoutubeLogo weight="fill" className="w-4 h-4" />;
    if (normalizedPlatform.includes('instagram')) return <InstagramLogo weight="fill" className="w-4 h-4" />;
    if (normalizedPlatform.includes('twitch')) return <TwitchLogo weight="fill" className="w-4 h-4" />;
    return null;
  };

  const fallbackSchemaOrgData = useMemo(() => ({
    '@context': 'https://schema.org' as const,
    '@type': 'Person' as const,
    name: profile?.username ?? '',
    image: profile?.avatarUrl,
    description: profile?.biography,
    sameAs: profile?.externalLinks?.map(link => link.url) ?? []
  }), [profile?.username, profile?.avatarUrl, profile?.biography, profile?.externalLinks]);

  if (!profile) return null;

  const maxCredits = 150;
  const creditsPercentage = (profile.votingCredits / maxCredits) * 100;
  const totalVotes = profile.votingHistory?.length || 0;
  const displayedBadges = profile.allBadges?.filter(b => profile.displayedBadges?.includes(b.id)) || [];

  const tasteProfileData = (profile.tasteProfile?.genreScores || profile.engagementStats?.genreAffinity || {}) as Record<Genre, number>;
  const roadToSuperfan = profile.roadToSuperfan || [];
  const personalCharts = profile.personalCharts || [];

  const schemaOrgData = profile.schemaOrgData || fallbackSchemaOrgData;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      {profile.isPublicProfile && <JsonLdScript data={schemaOrgData} />}
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
            </div>
            <div className="flex-1">
              <SheetTitle className="display-font text-2xl uppercase tracking-tight text-foreground mb-1">
                {profile.username}
              </SheetTitle>
              <div className="flex items-center gap-2 mb-2">
                <BadgeUI variant="outline" className="font-ui text-[10px] uppercase tracking-widest border-accent text-accent">
                  Fan
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
                <Coins weight="duotone" className="w-5 h-5 text-accent" />
                <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Voice Credits Wallet</h3>
              </div>
              <span className="data-font text-lg font-bold text-accent">
                {profile.votingCredits}/{maxCredits}
              </span>
            </div>
            <Progress value={creditsPercentage} className="h-2 mb-2" />
            <p className="font-ui text-[10px] text-muted-foreground uppercase tracking-widest">
              {creditsPercentage.toFixed(0)}% Available for Quadratic Voting
            </p>
          </Card>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy weight="duotone" className="w-5 h-5 text-accent" />
              <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Achievement Showcase</h3>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="aspect-square bg-secondary/50 animate-pulse border border-border" />
                ))}
              </div>
            ) : displayedBadges.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {displayedBadges.map((badge) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="bg-secondary border border-border p-3 text-center hover:border-accent transition-colors cursor-pointer group">
                      <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">
                        {badge.icon}
                      </div>
                      <p className="font-ui text-[9px] uppercase tracking-wider text-foreground font-semibold">
                        {badge.name}
                      </p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="bg-secondary/30 border border-border p-6 text-center">
                <Trophy weight="duotone" className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-40" />
                <p className="font-ui text-xs text-muted-foreground uppercase tracking-widest">
                  No Badges Earned Yet
                </p>
              </Card>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar weight="duotone" className="w-5 h-5 text-accent" />
              <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Voting Activity</h3>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <div className="h-3 bg-secondary/50 animate-pulse" />
                <div className="grid grid-cols-52 gap-[2px]">
                  {Array.from({ length: 365 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-secondary/50 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : (
              <Card className="bg-secondary border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="data-font text-xs text-muted-foreground">
                    {totalVotes} total votes
                  </span>
                  <span className="data-font text-xs text-muted-foreground">
                    Last 12 months
                  </span>
                </div>
                <div className="grid grid-cols-52 gap-[2px]">
                  {contributionData.map((day, index) => (
                    <div
                      key={index}
                      className={cn(
                        'aspect-square transition-all hover:ring-1 hover:ring-accent cursor-pointer',
                        getLevelColor(day.level)
                      )}
                      title={`${day.date.toLocaleDateString()}: ${day.count} votes`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3 justify-end">
                  <span className="font-ui text-[9px] text-muted-foreground uppercase tracking-widest">Less</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={cn('w-3 h-3', getLevelColor(level))}
                      />
                    ))}
                  </div>
                  <span className="font-ui text-[9px] text-muted-foreground uppercase tracking-widest">More</span>
                </div>
              </Card>
            )}
          </div>

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

          {Object.keys(tasteProfileData).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ChartPolar weight="duotone" className="w-5 h-5 text-accent" />
                <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Taste Profile</h3>
              </div>
              <Card className="bg-secondary border border-border p-6">
                <TasteProfileRadar genreScores={tasteProfileData} size={300} />
                <p className="font-ui text-[10px] text-muted-foreground text-center uppercase tracking-widest mt-4">
                  Genre-Affinität basierend auf deiner Voting-Historie
                </p>
              </Card>
            </div>
          )}

          {roadToSuperfan.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Flame weight="duotone" className="w-5 h-5 text-accent" />
                <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Road to Superfan</h3>
              </div>
              <div className="space-y-3">
                {roadToSuperfan.map((artist, index) => (
                  <Card key={index} className="bg-secondary border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-ui text-sm font-semibold text-foreground uppercase tracking-wider">{artist.artistName}</p>
                        <p className="data-font text-xs text-muted-foreground mt-1">
                          Level {artist.currentLevel} / {artist.maxLevel}
                        </p>
                      </div>
                      <div className="data-font text-lg font-bold text-accent">
                        {artist.progress}%
                      </div>
                    </div>
                    <Progress value={artist.progress} className="h-2" />
                  </Card>
                ))}
              </div>
            </div>
          )}

          {personalCharts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star weight="duotone" className="w-5 h-5 text-accent" />
                <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Personal All-Time Favorites</h3>
              </div>
              <Card className="bg-secondary border border-border p-4">
                <div className="space-y-2">
                  {personalCharts.slice(0, 10).map((trackId, index) => (
                    <div key={trackId} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <span className="data-font text-sm font-bold text-accent w-6">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-ui text-xs text-foreground uppercase tracking-wider">
                          Track ID: {trackId.substring(0, 12)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          <Card className="bg-secondary/30 border border-border p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isPublicProfile ? (
                    <Eye weight="duotone" className="w-5 h-5 text-accent" />
                  ) : (
                    <EyeSlash weight="duotone" className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label htmlFor="public-profile" className="display-font text-sm uppercase tracking-tight text-foreground cursor-pointer">
                      Profil öffentlich machen
                    </Label>
                    <p className="font-ui text-[10px] text-muted-foreground leading-relaxed mt-1">
                      Wenn deaktiviert, zählen deine Votes weiterhin, aber du bleibst komplett anonym.
                    </p>
                  </div>
                </div>
                <Switch
                  id="public-profile"
                  checked={isPublicProfile}
                  onCheckedChange={async (checked) => {
                    if (onUpdateProfile) {
                      setIsUpdating(true);
                      try {
                        await onUpdateProfile({ isPublicProfile: checked });
                        setIsPublicProfile(checked);
                      } catch (error) {
                        console.error('Failed to update profile visibility:', error);
                      } finally {
                        setIsUpdating(false);
                      }
                    }
                  }}
                  disabled={isUpdating || !onUpdateProfile}
                />
              </div>
            </div>
          </Card>

          <div className="pt-4 border-t border-border">
            <p className="data-font text-[9px] text-muted-foreground uppercase tracking-widest">
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
