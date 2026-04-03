import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, SignIn, SignOut, SpotifyLogo, AppleLogo, 
  PencilSimple, FloppyDisk, X, Trophy, Link as LinkIcon,
  MusicNotes, Users, Microphone, Buildings 
} from '@phosphor-icons/react';
import { FanProfile, BandProfile, DJProfile, LabelProfile, UserType } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

function LoginView() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (provider: 'spotify' | 'apple' | 'mock') => {
    setIsLoading(true);
    try {
      await login(provider);
      toast.success('Successfully logged in!');
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          Sign In to Dark Charts
        </h2>
        <p className="font-ui text-muted-foreground uppercase tracking-[0.2em] text-xs mb-8">
          Access your profile, vote for artists, and create custom charts
        </p>
        
        <div className="flex flex-col gap-4 max-w-md mx-auto">
          <Button
            onClick={() => handleLogin('spotify')}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 bg-[#1DB954] hover:bg-[#1DB954]/80 text-white snap-transition font-ui text-sm uppercase tracking-[0.12em] font-semibold h-12"
          >
            <SpotifyLogo weight="fill" className="w-5 h-5" />
            Continue with Spotify
          </Button>
          
          <Button
            onClick={() => handleLogin('apple')}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 bg-foreground hover:bg-foreground/80 text-background snap-transition font-ui text-sm uppercase tracking-[0.12em] font-semibold h-12"
          >
            <AppleLogo weight="fill" className="w-5 h-5" />
            Continue with Apple Music
          </Button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-4 text-muted-foreground font-ui tracking-[0.2em]">Or</span>
            </div>
          </div>
          
          <Button
            onClick={() => handleLogin('mock')}
            disabled={isLoading}
            variant="outline"
            className="flex items-center justify-center gap-3 snap-transition font-ui text-sm uppercase tracking-[0.12em] font-semibold h-12"
          >
            <SignIn weight="bold" className="w-5 h-5" />
            Demo Account
          </Button>
        </div>
      </div>
    </Card>
  );
}

function FanProfileView({ profile }: { profile: FanProfile }) {
  const { updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [biography, setBiography] = useState(profile.biography || '');

  const handleSave = async () => {
    try {
      await updateProfile({ username, biography });
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
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
                    Fan
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
                  Edit
                </Button>
                <Button
                  onClick={logout}
                  size="sm"
                  variant="outline"
                  className="snap-transition font-ui text-[10px] uppercase"
                >
                  <SignOut weight="bold" className="w-4 h-4 mr-1" />
                  Sign Out
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
                  Save
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
              {profile.biography || 'No biography yet. Click Edit to add one.'}
            </p>
          ) : (
            <Textarea
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              placeholder="Tell us about yourself..."
              className="bg-background border-border font-ui min-h-[100px]"
            />
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border border-border p-6">
          <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Voting Credits
          </p>
          <p className="data-font text-4xl font-bold text-primary">
            {profile.votingCredits}
          </p>
          <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
            Available for voting
          </p>
        </Card>

        <Card className="bg-card border border-border p-6">
          <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Voting History
          </p>
          <p className="data-font text-4xl font-bold text-accent">
            {profile.votingHistory.length}
          </p>
          <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
            Total votes cast
          </p>
        </Card>

        <Card className="bg-card border border-border p-6">
          <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Favorites
          </p>
          <p className="data-font text-4xl font-bold text-foreground">
            {profile.favoritesList.length}
          </p>
          <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
            Saved tracks
          </p>
        </Card>
      </div>

      {profile.allBadges.length > 0 && (
        <Card className="bg-card border border-border p-6">
          <h3 className="display-font text-xl uppercase tracking-tight text-foreground font-semibold mb-4">
            <Trophy weight="bold" className="w-5 h-5 inline mr-2" />
            Earned Badges
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="display-font text-4xl uppercase tracking-wider text-foreground font-semibold">
          Profile
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
        Profile
      </h1>

      {!user?.isAuthenticated ? (
        <LoginView />
      ) : user.profile?.userType === 'fan' ? (
        <FanProfileView profile={user.profile as FanProfile} />
      ) : (
        <Card className="bg-card border border-border p-8">
          <div className="text-center">
            <p className="font-ui text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Profile type: {user.profile?.userType || 'Unknown'}
            </p>
            <p className="font-ui text-xs text-muted-foreground mt-4">
              Full profile management for Band, DJ, and Label accounts coming soon.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
