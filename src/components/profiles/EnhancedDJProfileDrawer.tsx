import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DJProfile, Genre, CuratedChart } from '@/types';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  ChartLine,
  Trophy,
  Users,
  Target,
  Eye,
  EyeSlash,
  ArrowRight,
  Star
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { SafeImage } from '@/components/SafeImage';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedDJProfileDrawerProps {
  profile: DJProfile | null;
  isOpen: boolean;
  onClose: () => void;
  isOwnProfile?: boolean;
}

export function EnhancedDJProfileDrawer({ profile, isOpen, onClose, isOwnProfile = false }: EnhancedDJProfileDrawerProps) {
  const { updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBiography, setEditedBiography] = useState('');
  const [isPublicProfile, setIsPublicProfile] = useState(false);

  useEffect(() => {
    if (isOpen && profile) {
      setIsLoading(true);
      setEditedBiography(profile.biography || '');
      setIsPublicProfile(profile.isPublicProfile || false);
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    }
  }, [isOpen, profile]);

  useEffect(() => {
    if (isOpen && profile?.schemaOrgData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'dj-profile-schema';
      script.innerHTML = JSON.stringify(profile.schemaOrgData);
      document.head.appendChild(script);

      return () => {
        const existingScript = document.getElementById('dj-profile-schema');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
      };
    }
  }, [isOpen, profile]);

  const handleSaveBiography = async () => {
    if (!profile) return;
    
    try {
      await updateProfile({
        ...profile,
        biography: editedBiography
      });
      toast.success('Biography updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update biography');
    }
  };

  const handleTogglePublicProfile = async (checked: boolean) => {
    if (!profile) return;
    
    try {
      setIsPublicProfile(checked);
      await updateProfile({
        ...profile,
        isPublicProfile: checked
      });
      toast.success(checked ? 'Profile is now public' : 'Profile is now private');
    } catch (error) {
      toast.error('Failed to update privacy settings');
      setIsPublicProfile(!checked);
    }
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
  const predictivePower = profile.predictivePower;
  const subgenreAccuracy = profile.subgenreAccuracy || {};
  const curatedCharts = profile.curatedCharts || [];
  const earnedBadges = profile.earnedBadges || [];
  const nextBadgeProgress = profile.nextBadgeProgress;

  const topSubgenres = Object.entries(subgenreAccuracy)
    .sort((a, b) => {
      const aData = a[1];
      const bData = b[1];
      return bData.accuracy - aData.accuracy;
    })
    .slice(0, 5)
    .map(([genre, data]) => ({ genre, data }));

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-background border-l border-accent" side="right">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              {profile.avatarUrl ? (
                <div className="border-2 border-accent overflow-hidden">
                  <SafeImage
                    src={profile.avatarUrl}
                    alt={profile.username}
                    width={80}
                    height={80}
                    className="object-cover"
                    priority={true}
                  />
                </div>
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
                {isOwnProfile && (
                  <BadgeUI variant="outline" className="font-ui text-[10px] uppercase tracking-widest border-primary text-primary">
                    You
                  </BadgeUI>
                )}
              </div>
              {!isEditing ? (
                <div>
                  {profile.biography && (
                    <p className="font-ui text-xs text-muted-foreground leading-relaxed mb-2">
                      {profile.biography}
                    </p>
                  )}
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-6 px-2 text-[10px] uppercase tracking-wider"
                    >
                      Edit Bio
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    value={editedBiography}
                    onChange={(e) => setEditedBiography(e.target.value)}
                    placeholder="Describe your expertise and involvement in the scene..."
                    className="font-ui text-xs min-h-[80px]"
                    maxLength={500}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveBiography}
                      className="h-7 px-3 text-[10px] uppercase tracking-wider"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedBiography(profile.biography || '');
                      }}
                      className="h-7 px-3 text-[10px] uppercase tracking-wider"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {isOwnProfile && (
            <Card className="bg-secondary/50 border border-border p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isPublicProfile ? <Eye weight="duotone" className="w-4 h-4 text-accent" /> : <EyeSlash weight="duotone" className="w-4 h-4 text-muted-foreground" />}
                    <Label htmlFor="public-profile" className="font-ui text-xs uppercase tracking-wider text-foreground cursor-pointer">
                      Public Profile
                    </Label>
                  </div>
                  <p className="font-ui text-[10px] text-muted-foreground leading-relaxed">
                    {isPublicProfile 
                      ? 'Your profile is visible to others. Your votes count and you appear in Top Supporters.'
                      : 'Profile is private. Your votes count, but you remain completely anonymous.'}
                  </p>
                </div>
                <Switch
                  id="public-profile"
                  checked={isPublicProfile}
                  onCheckedChange={handleTogglePublicProfile}
                />
              </div>
            </Card>
          )}

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
            <p className="font-ui text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
              Reputation reflects credibility, voting history, and community trust
            </p>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              <div>
                <p className="font-ui text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Expert Weight
                </p>
                <p className="data-font text-lg font-bold text-foreground">
                  {expertWeight.toFixed(2)}x
                </p>
                <p className="font-ui text-[9px] text-muted-foreground mt-1">
                  Vote multiplier
                </p>
              </div>
              <div>
                <p className="font-ui text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  References
                </p>
                <p className="data-font text-lg font-bold text-foreground">
                  {profile.references?.length || 0}
                </p>
                <p className="font-ui text-[9px] text-muted-foreground mt-1">
                  Professional endorsements
                </p>
              </div>
            </div>
          </Card>

          {predictivePower && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendUp weight="duotone" className="w-5 h-5 text-accent" />
                <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Predictive Power</h3>
              </div>

              <Card className="bg-secondary border border-border p-4 mb-3">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="font-ui text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                      Accuracy
                    </p>
                    <p className="data-font text-2xl font-bold text-accent">
                      {predictivePower.accuracy.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center border-l border-r border-border">
                    <p className="font-ui text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                      Correct
                    </p>
                    <p className="data-font text-2xl font-bold text-foreground">
                      {predictivePower.correctPredictions}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-ui text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                      Total
                    </p>
                    <p className="data-font text-2xl font-bold text-foreground">
                      {predictivePower.totalPredictions}
                    </p>
                  </div>
                </div>
                <Progress value={predictivePower.accuracy} className="h-2" />
              </Card>

              {isLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-secondary/50 animate-pulse border border-border" />
                  ))}
                </div>
              ) : predictivePower.earlyPredictions && predictivePower.earlyPredictions.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-ui text-xs text-muted-foreground uppercase tracking-wider mb-3">
                    Supported before Top 10 entry
                  </p>
                  {predictivePower.earlyPredictions.slice(0, 5).map((prediction, index) => (
                    <motion.div
                      key={`${prediction.trackId}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-background border border-border hover:border-foreground hover:shadow-[0_0_8px_rgba(255,255,255,0.15)] transition-all p-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle weight="fill" className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-ui text-sm text-foreground font-semibold truncate">
                              {prediction.trackTitle}
                            </p>
                            <p className="font-ui text-xs text-muted-foreground">
                              {prediction.artistName}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-[10px] font-ui text-muted-foreground uppercase tracking-wider">
                              <span>{prediction.weeksBeforeEntry} weeks early</span>
                              <span>•</span>
                              <span>Peaked #{prediction.finalPosition}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="bg-secondary/30 border border-border p-6 text-center">
                  <TrendUp weight="duotone" className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-40" />
                  <p className="font-ui text-xs text-muted-foreground uppercase tracking-widest">
                    No Early Predictions Yet
                  </p>
                </Card>
              )}
            </div>
          )}

          {topSubgenres.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target weight="duotone" className="w-5 h-5 text-accent" />
                <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Subgenre Accuracy</h3>
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
                    Accuracy across {Object.keys(subgenreAccuracy).length} subgenres
                  </p>
                  <div className="space-y-3">
                    {topSubgenres.map(({ genre, data }, index) => (
                      <motion.div
                        key={genre}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-ui text-xs text-foreground uppercase tracking-wider">
                            {genre}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="data-font text-[10px] text-muted-foreground">
                              {data.successfulVotes}/{data.totalVotes}
                            </span>
                            <span className="data-font text-sm font-bold text-accent">
                              {data.accuracy.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <Progress value={data.accuracy} className="h-1.5" />
                      </motion.div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {curatedCharts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MusicNotes weight="duotone" className="w-5 h-5 text-accent" />
                <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Curated Charts</h3>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-20 bg-secondary/50 animate-pulse border border-border" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {curatedCharts.slice(0, 5).map((chart, index) => (
                    <motion.div
                      key={chart.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-secondary border border-border p-3 hover:border-foreground hover:shadow-[0_0_8px_rgba(255,255,255,0.15)] transition-all cursor-pointer group">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-ui text-sm text-foreground font-semibold uppercase tracking-wide truncate">
                                {chart.title}
                              </p>
                              {chart.isPublic && (
                                <Eye weight="duotone" className="w-3 h-3 text-accent flex-shrink-0" />
                              )}
                            </div>
                            {chart.description && (
                              <p className="font-ui text-xs text-muted-foreground mb-2 line-clamp-2">
                                {chart.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-[10px] font-ui text-muted-foreground uppercase tracking-wider">
                              <span>{chart.trackIds.length} tracks</span>
                              <span>•</span>
                              <span>{chart.followerCount} followers</span>
                              <span>•</span>
                              <span>Updated {new Date(chart.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-[10px] uppercase tracking-wider group-hover:border-accent group-hover:text-accent transition-colors"
                          >
                            Follow
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {earnedBadges.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Trophy weight="duotone" className="w-5 h-5 text-accent" />
                <h3 className="display-font text-sm uppercase tracking-tight text-foreground">Earned Badges</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {earnedBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-secondary border border-accent/50 p-3 text-center">
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <p className="font-ui text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                        {badge.name}
                      </p>
                      <p className="font-ui text-[10px] text-muted-foreground leading-tight">
                        {badge.description}
                      </p>
                      <p className="font-ui text-[9px] text-muted-foreground uppercase tracking-widest mt-2">
                        Earned {new Date(badge.earnedAt).toLocaleDateString()}
                      </p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {isOwnProfile && nextBadgeProgress && (
            <Card className="bg-secondary/50 border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Star weight="duotone" className="w-4 h-4 text-accent" />
                <h4 className="font-ui text-xs uppercase tracking-wider text-foreground">Next Badge Progress</h4>
              </div>
              <p className="font-ui text-sm font-semibold text-foreground mb-2">{nextBadgeProgress.badgeName}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-ui text-muted-foreground">
                  <span>{nextBadgeProgress.currentProgress} / {nextBadgeProgress.requiredProgress}</span>
                  <span>{nextBadgeProgress.percentageComplete.toFixed(0)}%</span>
                </div>
                <Progress value={nextBadgeProgress.percentageComplete} className="h-2" />
              </div>
            </Card>
          )}

          {!isOwnProfile && (
            <div className="flex items-center gap-3 pt-4">
              <Button className="flex-1 font-ui uppercase tracking-wider" size="lg">
                <Users weight="bold" className="w-4 h-4 mr-2" />
                Follow DJ
              </Button>
            </div>
          )}

          {isOwnProfile && (
            <Card className="bg-secondary/30 border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users weight="duotone" className="w-4 h-4 text-accent" />
                <h4 className="font-ui text-xs uppercase tracking-wider text-foreground">Your Following</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="data-font text-2xl font-bold text-foreground">
                    {profile.followerIds?.length || 0}
                  </p>
                  <p className="font-ui text-[10px] text-muted-foreground uppercase tracking-wider">
                    Followers
                  </p>
                </div>
                <div>
                  <p className="data-font text-2xl font-bold text-foreground">
                    {profile.followingIds?.length || 0}
                  </p>
                  <p className="font-ui text-[10px] text-muted-foreground uppercase tracking-wider">
                    Following
                  </p>
                </div>
              </div>
            </Card>
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
                    className="border-border hover:border-foreground hover:shadow-[0_0_8px_rgba(255,255,255,0.15)] transition-all"
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
