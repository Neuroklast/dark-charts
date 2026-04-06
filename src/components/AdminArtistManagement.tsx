import { useState, useEffect } from 'react';
import { Artist, Release, ArtistCacheStatus } from '@/types';
import { artistManagementService } from '@/services/artistManagementService';
import { spotifyService } from '@/services/spotifyService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash, Pencil, ArrowsClockwise, MusicNote, SpotifyLogo, Check, X, Warning, MagnifyingGlass, UploadSimple, ListPlus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SpotifyAuthButton } from '@/components/SpotifyAuthButton';
import { SyncJobManager } from '@/components/SyncJobManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);

  const handleCsvImport = async () => {
    if (!csvFile) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const text = await csvFile.text();
      const lines = text.split('\n');
      // Skip header, parse lines
      const artistsToImport = lines
        .slice(1)
        .filter(line => line.trim())
        .map(line => {
          // Allow quoted CSV or simple comma split (assuming no commas in artist name for simplicity, or simple parsing)
          // Since the example is "Artist,Spotify_ID", let's handle basic split
          const lastCommaIndex = line.lastIndexOf(',');
          if (lastCommaIndex === -1) return null;
          const name = line.substring(0, lastCommaIndex).trim();
          const spotifyId = line.substring(lastCommaIndex + 1).trim();
          return { name, spotifyId };
        })
        .filter(Boolean) as { name: string, spotifyId: string }[];

      setImportTotal(artistsToImport.length);

      let importedCount = 0;
      for (const artistData of artistsToImport) {
        // Check if artist already exists by spotifyId
        const exists = artists.some(a => a.spotifyId === artistData.spotifyId);
        if (!exists) {
          await artistManagementService.createArtist({
            name: artistData.name,
            spotifyId: artistData.spotifyId,
            genres: [],
          });
        }
        importedCount++;
        setImportProgress(importedCount);
      }

      toast.success(`Successfully imported artists from CSV`);
      loadArtists();
      setIsBulkDialogOpen(false);
      setCsvFile(null);
    } catch (error) {
      console.error('CSV import failed', error);
      toast.error('Failed to import artists from CSV');
    } finally {
      setIsImporting(false);
    }
  };

  const handlePlaylistImport = async () => {
    if (!playlistUrl) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Extract playlist ID from URL
      // Format: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
      const match = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
      if (!match) {
        toast.error('Invalid Spotify Playlist URL');
        setIsImporting(false);
        return;
      }
      const playlistId = match[1];

      const playlistData = await spotifyService.getPlaylist(playlistId);
      if (!playlistData || !playlistData.tracks || !playlistData.tracks.items) {
        toast.error('Failed to fetch playlist data. Make sure you are authenticated with Spotify.');
        setIsImporting(false);
        return;
      }

      // Extract unique artists
      const uniqueArtistsMap = new Map<string, { name: string, spotifyId: string }>();

      playlistData.tracks.items.forEach((item: any) => {
        if (item.track && item.track.artists) {
          item.track.artists.forEach((artist: any) => {
            if (artist.id && artist.name && !uniqueArtistsMap.has(artist.id)) {
              uniqueArtistsMap.set(artist.id, { name: artist.name, spotifyId: artist.id });
            }
          });
        }
      });

      const artistsToImport = Array.from(uniqueArtistsMap.values());
      setImportTotal(artistsToImport.length);

      let importedCount = 0;
      for (const artistData of artistsToImport) {
        // Check if artist already exists by spotifyId
        const exists = artists.some(a => a.spotifyId === artistData.spotifyId);
        if (!exists) {
          await artistManagementService.createArtist({
            name: artistData.name,
            spotifyId: artistData.spotifyId,
            genres: [],
          });
        }
        importedCount++;
        setImportProgress(importedCount);
      }

      toast.success(`Successfully imported artists from playlist`);
      loadArtists();
      setIsBulkDialogOpen(false);
      setPlaylistUrl('');
    } catch (error) {
      console.error('Playlist import failed', error);
      toast.error('Failed to import artists from playlist');
    } finally {
      setIsImporting(false);
    }
  };

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
          <SpotifyAuthButton />
        </div>
      </div>

      <Tabs defaultValue="artists" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="artists">{t('Artist Management')}</TabsTrigger>
          <TabsTrigger value="sync">{t('Sync Jobs')}</TabsTrigger>
        </TabsList>

        <TabsContent value="artists" className="space-y-6">
          <div className="flex items-center justify-between">
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
            <div className="flex gap-2">
              <DialogTrigger asChild>
                <Button onClick={() => setEditingArtist(null)} className="gap-2">
                  <Plus weight="bold" />
                  {t('admin.addArtist')}
                </Button>
              </DialogTrigger>
              <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <UploadSimple weight="bold" />
                    Bulk Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="display-font text-xl uppercase">
                      Bulk Import Artists
                    </DialogTitle>
                    <DialogDescription>
                      Import artists from a CSV file or a Spotify Playlist.
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="csv" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="csv">CSV Upload</TabsTrigger>
                      <TabsTrigger value="playlist">Spotify Playlist</TabsTrigger>
                    </TabsList>
                    <TabsContent value="csv" className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Upload CSV (Format: Artist,Spotify_ID)</Label>
                        <Input
                          type="file"
                          accept=".csv"
                          onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                          disabled={isImporting}
                        />
                      </div>
                      <Button
                        onClick={handleCsvImport}
                        disabled={!csvFile || isImporting}
                        className="w-full gap-2"
                      >
                        {isImporting ? <ArrowsClockwise className="animate-spin" /> : <UploadSimple />}
                        {isImporting ? `Importing (${importProgress}/${importTotal})...` : 'Import CSV'}
                      </Button>
                    </TabsContent>
                    <TabsContent value="playlist" className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Spotify Playlist URL</Label>
                        <Input
                          placeholder="https://open.spotify.com/playlist/..."
                          value={playlistUrl}
                          onChange={(e) => setPlaylistUrl(e.target.value)}
                          disabled={isImporting}
                        />
                      </div>
                      <Button
                        onClick={handlePlaylistImport}
                        disabled={!playlistUrl || isImporting}
                        className="w-full gap-2"
                      >
                        {isImporting ? <ArrowsClockwise className="animate-spin" /> : <ListPlus />}
                        {isImporting ? `Importing (${importProgress}/${importTotal})...` : 'Import Playlist'}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="display-font text-xl uppercase">
                  {editingArtist ? t('admin.editArtist') : t('admin.addArtist')}
                </DialogTitle>
                <DialogDescription>
                  {editingArtist ? 'Update artist information and settings.' : 'Add a new artist to the charts database.'}
                </DialogDescription>
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
              <DialogDescription>
                View and manage all releases for this artist.
              </DialogDescription>
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
        </TabsContent>

        <TabsContent value="sync">
          <SyncJobManager />
        </TabsContent>
      </Tabs>
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
