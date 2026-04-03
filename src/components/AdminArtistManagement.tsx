import { useState, useEffect } from 'react';
import { Artist, Release, ArtistCacheStatus } from '@/types';
import { artistManagementService } from '@/services/artistManagementService';
import { spotifyService } from '@/services/spotifyService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash, Pencil, ArrowsClockwise, MusicNote, SpotifyLogo, Check, X, Warning, MagnifyingGlass } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SpotifyAuthButton } from '@/components/SpotifyAuthButton';

export function AdminArtistManagement() {
  const { t } = useLanguage();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [cacheStatuses, setCacheStatuses] = useState<Map<string, ArtistCacheStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);

  useEffect(() => {
    loadArtists();
    loadCacheStatuses();
    
    const interval = setInterval(() => {
      loadCacheStatuses();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadArtists = async () => {
    setIsLoading(true);
    try {
      const data = await artistManagementService.getAllArtists();
      setArtists(data);
    } catch (error) {
      toast.error(t('admin.error.loadArtists'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadCacheStatuses = async () => {
    try {
      const statuses = await artistManagementService.getAllCacheStatuses();
      const statusMap = new Map<string, ArtistCacheStatus>();
      statuses.forEach(status => statusMap.set(status.artistId, status));
      setCacheStatuses(statusMap);
    } catch (error) {
      console.error('Failed to load cache statuses:', error);
    }
  };

  const loadReleases = async (artistId: string) => {
    try {
      const data = await artistManagementService.getArtistReleases(artistId);
      setReleases(data);
    } catch (error) {
      toast.error(t('admin.error.loadReleases'));
    }
  };

  const handleCreateArtist = async (data: Omit<Artist, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await artistManagementService.createArtist(data);
      toast.success(t('admin.success.artistCreated'));
      loadArtists();
      loadCacheStatuses();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(t('admin.error.createArtist'));
    }
  };

  const handleUpdateArtist = async (artistId: string, data: Partial<Artist>) => {
    try {
      await artistManagementService.updateArtist(artistId, data);
      toast.success(t('admin.success.artistUpdated'));
      loadArtists();
      setEditingArtist(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(t('admin.error.updateArtist'));
    }
  };

  const handleDeleteArtist = async (artistId: string) => {
    if (!confirm(t('admin.confirm.deleteArtist'))) return;
    
    try {
      await artistManagementService.deleteArtist(artistId);
      toast.success(t('admin.success.artistDeleted'));
      loadArtists();
      loadCacheStatuses();
    } catch (error) {
      toast.error(t('admin.error.deleteArtist'));
    }
  };

  const handleSyncArtist = async (artistId: string) => {
    try {
      toast.info(t('admin.info.syncStarted'));
      await artistManagementService.syncArtistReleases(artistId);
      loadCacheStatuses();
      if (selectedArtist?.id === artistId) {
        loadReleases(artistId);
      }
      toast.success(t('admin.success.syncCompleted'));
    } catch (error) {
      toast.error(t('admin.error.syncFailed'));
    }
  };

  const handleSyncAll = async () => {
    if (!confirm(t('admin.confirm.syncAll'))) return;
    
    setIsSyncing(true);
    try {
      toast.info(t('admin.info.syncAllStarted'));
      await artistManagementService.syncAllArtists();
      loadCacheStatuses();
      toast.success(t('admin.success.syncAllCompleted'));
    } catch (error) {
      toast.error(t('admin.error.syncAllFailed'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleViewReleases = async (artist: Artist) => {
    setSelectedArtist(artist);
    await loadReleases(artist.id);
  };

  const getCacheStatusBadge = (artistId: string) => {
    const status = cacheStatuses.get(artistId);
    if (!status) return null;

    const statusConfig = {
      syncing: { color: 'bg-accent', icon: ArrowsClockwise, text: t('admin.status.syncing') },
      success: { color: 'bg-green-600', icon: Check, text: t('admin.status.success') },
      error: { color: 'bg-primary', icon: X, text: t('admin.status.error') },
    };

    const config = statusConfig[status.status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white border-0 gap-1`}>
        <Icon weight="bold" className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const getNextSyncTime = (artistId: string) => {
    const status = cacheStatuses.get(artistId);
    if (!status) return null;

    const hoursUntilSync = Math.max(0, Math.round((status.nextSync - Date.now()) / (1000 * 60 * 60)));
    return `${hoursUntilSync}h`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 bg-card border border-border">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 bg-muted" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3 bg-muted" />
                <Skeleton className="h-3 w-1/2 bg-muted" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="display-font text-2xl uppercase text-foreground tracking-tight font-semibold">
            {t('admin.title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t('admin.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSyncAll}
            disabled={isSyncing}
            variant="outline"
            className="gap-2"
          >
            <ArrowsClockwise weight="bold" className={isSyncing ? 'animate-spin' : ''} />
            {t('admin.syncAll')}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingArtist(null)} className="gap-2">
                <Plus weight="bold" />
                {t('admin.addArtist')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="display-font text-xl uppercase">
                  {editingArtist ? t('admin.editArtist') : t('admin.addArtist')}
                </DialogTitle>
              </DialogHeader>
              <ArtistForm
                artist={editingArtist}
                onSave={(data) => {
                  if (editingArtist) {
                    handleUpdateArtist(editingArtist.id, data);
                  } else {
                    handleCreateArtist(data as Omit<Artist, 'id' | 'createdAt' | 'updatedAt'>);
                  }
                }}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingArtist(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {artists.map((artist) => (
          <Card key={artist.id} className="cyber-card p-6 relative group">
            <div className="cyber-scanline" />
            <div className="relative z-10 flex items-start gap-6">
              {artist.artwork && (
                <img
                  src={artist.artwork}
                  alt={artist.name}
                  className="w-20 h-20 object-cover border border-border"
                />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="display-font text-lg uppercase text-foreground font-semibold">
                      {artist.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {artist.genres.map((genre, idx) => (
                        <Badge key={idx} variant="outline" className="text-[8px] uppercase">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getCacheStatusBadge(artist.id)}
                  </div>
                </div>

                {artist.bio && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{artist.bio}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  {artist.spotifyId && (
                    <div className="flex items-center gap-1">
                      <SpotifyLogo weight="fill" className="w-4 h-4" />
                      {artist.spotifyId}
                    </div>
                  )}
                  {cacheStatuses.get(artist.id) && (
                    <div className="flex items-center gap-1">
                      <MusicNote weight="fill" className="w-4 h-4" />
                      {cacheStatuses.get(artist.id)?.releaseCount || 0} {t('admin.releases')}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <ArrowsClockwise weight="bold" className="w-4 h-4" />
                    {t('admin.nextSync')}: {getNextSyncTime(artist.id)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewReleases(artist)}
                    className="gap-1"
                  >
                    <MusicNote weight="bold" />
                    {t('admin.viewReleases')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSyncArtist(artist.id)}
                    className="gap-1"
                  >
                    <ArrowsClockwise weight="bold" />
                    {t('admin.sync')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingArtist(artist);
                      setIsDialogOpen(true);
                    }}
                    className="gap-1"
                  >
                    <Pencil weight="bold" />
                    {t('admin.edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteArtist(artist.id)}
                    className="gap-1"
                  >
                    <Trash weight="bold" />
                    {t('admin.delete')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedArtist && (
        <Dialog open={!!selectedArtist} onOpenChange={() => setSelectedArtist(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="display-font text-xl uppercase">
                {t('admin.releasesFor')}: {selectedArtist.name}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              {releases.map((release) => (
                <Card key={release.id} className="p-4 border border-border bg-card">
                  <div className="flex items-start gap-4">
                    {release.albumArt && (
                      <img
                        src={release.albumArt}
                        alt={release.title}
                        className="w-16 h-16 object-cover border border-border"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{release.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(release.releaseDate).toLocaleDateString()} • {release.type}
                      </p>
                      {release.tracks && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {release.tracks.length} {t('admin.tracks')}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface ArtistFormProps {
  artist: Artist | null;
  onSave: (data: Partial<Artist>) => void;
  onCancel: () => void;
}

function ArtistForm({ artist, onSave, onCancel }: ArtistFormProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(artist?.name || '');
  const [spotifyId, setSpotifyId] = useState(artist?.spotifyId || '');
  const [bio, setBio] = useState(artist?.bio || '');
  const [artwork, setArtwork] = useState(artist?.artwork || '');
  const [genresInput, setGenresInput] = useState(artist?.genres.join(', ') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const genres = genresInput.split(',').map(g => g.trim()).filter(Boolean);
    
    onSave({
      name,
      spotifyId: spotifyId || undefined,
      bio: bio || undefined,
      artwork: artwork || undefined,
      genres: genres as any[],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">{t('admin.form.name')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="spotifyId">{t('admin.form.spotifyId')}</Label>
        <Input
          id="spotifyId"
          value={spotifyId}
          onChange={(e) => setSpotifyId(e.target.value)}
          className="mt-1"
          placeholder="spotify:artist:..."
        />
      </div>

      <div>
        <Label htmlFor="genres">{t('admin.form.genres')}</Label>
        <Input
          id="genres"
          value={genresInput}
          onChange={(e) => setGenresInput(e.target.value)}
          className="mt-1"
          placeholder="Gothic Rock, Dark Wave, ..."
        />
        <p className="text-xs text-muted-foreground mt-1">{t('admin.form.genresHelp')}</p>
      </div>

      <div>
        <Label htmlFor="artwork">{t('admin.form.artwork')}</Label>
        <Input
          id="artwork"
          value={artwork}
          onChange={(e) => setArtwork(e.target.value)}
          className="mt-1"
          placeholder="https://..."
        />
      </div>

      <div>
        <Label htmlFor="bio">{t('admin.form.bio')}</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="mt-1"
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('admin.form.cancel')}
        </Button>
        <Button type="submit">
          {t('admin.form.save')}
        </Button>
      </div>
    </form>
  );
}
