import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SpotifyLogo, SignOut } from '@phosphor-icons/react';
import { spotifyService } from '@/services/spotifyService';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

export function SpotifyAuthButton() {
  const { t } = useLanguage();
  const { login: authContextLogin } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const authenticated = await spotifyService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      logger.error('Failed to check Spotify authentication', { error });
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const isSpark = import.meta.env.VITE_IS_SPARK === 'true' || window.location.hostname.includes('spark');
      if (isSpark) {
        logger.info('Using Spark Bypass for Spotify Auth');
        await authContextLogin('spotify');
        setIsAuthenticated(true);
        toast.success('Spark Bypass Login erfolgreich');
      } else {
        await spotifyService.initiateAuth();
      }
    } catch (error) {
      logger.error('Spotify login failed', { error });
      toast.error(t('admin.error.spotifyLogin'));
    }
  };

  const handleLogout = async () => {
    try {
      await spotifyService.logout();
      setIsAuthenticated(false);
      toast.success(t('admin.success.spotifyLogout'));
    } catch (error) {
      logger.error('Spotify logout failed', { error });
      toast.error(t('admin.error.spotifyLogout'));
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <SpotifyLogo weight="fill" className="w-4 h-4" />
        {t('admin.loading')}
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Button
        variant="outline"
        onClick={handleLogout}
        className="gap-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
      >
        <SpotifyLogo weight="fill" className="w-4 h-4" />
        {t('admin.spotifyConnected')}
        <SignOut weight="bold" className="w-4 h-4 ml-1" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogin}
      className="gap-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
    >
      <SpotifyLogo weight="fill" className="w-4 h-4" />
      {t('admin.connectSpotify')}
    </Button>
  );
}
