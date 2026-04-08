import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, SignOut,
  PencilSimple, FloppyDisk, X, Trophy, Link as LinkIcon,
  MusicNotes, Users, Microphone, Buildings 
} from '@phosphor-icons/react';
import { FanProfile, BandProfile, DJProfile, LabelProfile, UserType } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { OAuthLoginButtons } from '@/components/OAuthLoginButtons';
import { ProfileStatsSkeleton, ProfileActivitySkeleton } from '@/components/skeletons';

function LoginView() {
  const { t } = useLanguage();

  return (
    <Card className="bg-card border border-accent p-12 text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, var(--border) 8px, var(--border) 16px)`
        }} />
      </div>
      <div className="relative">
        <User weight="duotone" className="w-24 h-24 mx-auto text-muted-foreground mb-6 opacity-40" />
        <h2 className="display-font text-3xl md:text-4xl uppercase text-foreground mb-4 tracking-tight font-semibold">
          {t('profile.signIn')}
        </h2>
        <p className="font-ui text-muted-foreground uppercase tracking-[0.2em] text-xs mb-8">
          {t('profile.signInDescription')}
        </p>

        <div className="max-w-md mx-auto">
          <OAuthLoginButtons />
        </div>
      </div>
    </Card>
  );
}

function FanProfileView({ profile }: { profile: FanProfile }) {
  const { updateProfile, logout } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [biography, setBiography] = useState(profile.biography || '');
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingStats(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    try {
      await updateProfile({ username, biography });
      setIsEditing(false);
      toast.success(t('profile.saveChanges') || 'Profile updated successfully!');
    } catch (error) {
      toast.error(t('oauth.loginFailed') || 'Failed to update profile');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary border-2 border-primary flex items-center justify-center">
              <User weight="bold" className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              {!isEditing ? (
                <>
                  <h2 className="display-font text-2xl uppercase tracking-tight text-foreground font-semibold">
                    {profile.username}
                  </h2>
                  <Badge className="mt-2 bg-primary text-primary-foreground font-ui text-[10px] uppercase">
                    <MusicNotes weight="bold" className="w-3 h-3 mr-1" />
                    {t('profile.fan')}
                  </Badge>
                </>
              ) : (
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background border-border font-ui text-lg font-bold uppercase"
                />
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  className="snap-transition font-ui text-[10px] uppercase"
                >
                  <PencilSimple weight="bold" className="w-4 h-4 mr-1" />
                  {t('profile.edit')}
                </Button>
                <Button
                  onClick={logout}
                  size="sm"
                  variant="outline"
                  className="snap-transition font-ui text-[10px] uppercase"
                >
                  <SignOut weight="bold" className="w-4 h-4 mr-1" />
                  {t('profile.signOut')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="bg-primary hover:bg-primary/80 snap-transition font-ui text-[10px] uppercase"
                >
                  <FloppyDisk weight="bold" className="w-4 h-4 mr-1" />
                  {t('profile.save')}
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  size="sm"
                  variant="outline"
                  className="snap-transition font-ui text-[10px] uppercase"
                >
                  <X weight="bold" className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-6">
          {!isEditing ? (
            <p className="font-ui text-sm text-muted-foreground leading-relaxed">
              {profile.biography || t('profile.noBio')}
            </p>
          ) : (
            <Textarea
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              placeholder={t('profile.bioPlaceholder')}
              className="bg-background border-border font-ui min-h-[100px]"
            />
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border border-border p-6">
          <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            {t('profile.votingCredits')}
          </p>
          <p className="data-font text-4xl font-bold text-primary">
            {profile.votingCredits}
          </p>
          <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
            {t('profile.availableForVoting')}
          </p>
        </Card>

        <Card className="bg-card border border-border p-6">
          <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            {t('profile.votingHistory')}
          </p>
          <p className="data-font text-4xl font-bold text-accent">
            {profile.votingHistory.length}
          </p>
          <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
            {t('profile.totalVotesCast')}
          </p>
        </Card>

        <Card className="bg-card border border-border p-6">
          <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            {t('profile.favorites')}
          </p>
          <p className="data-font text-4xl font-bold text-foreground">
            {profile.favoritesList.length}
          </p>
          <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
            {t('profile.savedTracks')}
          </p>
        </Card>
      </div>

      {profile.allBadges.length > 0 && (
        <Card className="bg-card border border-border p-6">
          <h3 className="display-font text-xl uppercase tracking-tight text-foreground font-semibold mb-4">
            <Trophy weight="bold" className="w-5 h-5 inline mr-2" />
            {t('profile.earnedBadges')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {profile.allBadges.map(badge => (
              <div
                key={badge.id}
                className="border border-border bg-secondary/10 p-4 text-center snap-transition hover:border-accent"
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <p className="font-ui text-[10px] uppercase tracking-[0.12em] font-bold text-foreground">
                  {badge.name}
                </p>
                <p className="font-ui text-[8px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export function ProfileView() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold">
          {t('profile.title')}
        </h1>
        <Card className="bg-card border border-border p-12 text-center">
          <div className="animate-pulse">
            <div className="w-24 h-24 bg-secondary mx-auto mb-4" />
            <div className="h-6 bg-secondary w-48 mx-auto mb-2" />
            <div className="h-4 bg-secondary w-32 mx-auto" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold">
        {t('profile.title')}
      </h1>

      {!user?.isAuthenticated ? (
        <LoginView />
      ) : user.profile?.userType === 'fan' ? (
        <FanProfileView profile={user.profile as FanProfile} />
      ) : (
        <Card className="bg-card border border-border p-8">
          <div className="text-center">
            <p className="font-ui text-sm uppercase tracking-[0.2em] text-muted-foreground">
              {t('profile.profileType')}: {user.profile?.userType || 'Unknown'}
            </p>
            <p className="font-ui text-xs text-muted-foreground mt-4">
              {t('profile.comingSoon')}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
