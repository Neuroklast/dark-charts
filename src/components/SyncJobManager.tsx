import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Play, 
  Pause, 
  ArrowsClockwise, 
  CheckCircle, 
  XCircle,
  Moon,
  Calendar,
  Lightning
} from '@phosphor-icons/react';
import { nightlySyncService } from '@/services/nightlySyncService';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function SyncJobManager() {
  const { language } = useLanguage();
  const [status, setStatus] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const t = (de: string, en: string) => language === 'de' ? de : en;

  const loadData = async () => {
    const [statusData, settingsData, historyData] = await Promise.all([
      nightlySyncService.getStatus(),
      nightlySyncService.getSettings(),
      nightlySyncService.getSyncHistory()
    ]);
    setStatus(statusData);
    setSettings(settingsData);
    setHistory(historyData);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleEnabled = async (enabled: boolean) => {
    try {
      if (enabled) {
        await nightlySyncService.start();
        toast.success(t('Automatischer Sync aktiviert', 'Automatic sync enabled'));
      } else {
        await nightlySyncService.stop();
        toast.success(t('Automatischer Sync deaktiviert', 'Automatic sync disabled'));
      }
      await loadData();
    } catch (error) {
      toast.error(t('Fehler beim Ändern der Einstellungen', 'Error updating settings'));
    }
  };

  const handleManualSync = async () => {
    setIsRefreshing(true);
    try {
      toast.info(t('Starte manuellen Sync...', 'Starting manual sync...'));
      await nightlySyncService.runManualSync();
      toast.success(t('Sync erfolgreich abgeschlossen', 'Sync completed successfully'));
      await loadData();
    } catch (error) {
      toast.error(t('Sync fehlgeschlagen', 'Sync failed'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateSyncTime = async (syncTime: string) => {
    try {
      await nightlySyncService.updateSettings({ syncTime });
      toast.success(t('Sync-Zeit aktualisiert', 'Sync time updated'));
      await loadData();
    } catch (error) {
      toast.error(t('Fehler beim Aktualisieren', 'Error updating'));
    }
  };

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return t('Nie', 'Never');
    return new Date(timestamp).toLocaleString(language === 'de' ? 'de-DE' : 'en-US');
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const getNextRunTime = () => {
    if (!status || status.nextRun === 0) {
      return t('Nicht geplant', 'Not scheduled');
    }
    
    const nextRun = new Date(status.nextRun);
    const now = new Date();
    const diff = nextRun.getTime() - now.getTime();
    
    if (diff <= 0) {
      return t('Überfällig', 'Overdue');
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${t('In', 'In')} ${hours}h ${minutes}m`;
  };

  if (!status || !settings) {
    return (
      <Card className="bg-card border border-border p-6">
        <div className="flex items-center justify-center py-12">
          <ArrowsClockwise className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="display-font text-2xl uppercase text-foreground tracking-tight font-semibold flex items-center gap-2">
                <Moon className="w-6 h-6" />
                {t('Nächtlicher Sync-Job', 'Nightly Sync Job')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t(
                  'Automatische Synchronisation aller Artist-Releases',
                  'Automatic synchronization of all artist releases'
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="sync-enabled" className="text-sm">
                  {t('Aktiviert', 'Enabled')}
                </Label>
                <Switch
                  id="sync-enabled"
                  checked={settings.enabled}
                  onCheckedChange={handleToggleEnabled}
                />
              </div>
              <Button
                onClick={handleManualSync}
                disabled={isRefreshing || status.isRunning}
                variant="outline"
                size="sm"
              >
                {isRefreshing || status.isRunning ? (
                  <>
                    <ArrowsClockwise className="w-4 h-4 mr-2 animate-spin" />
                    {t('Läuft...', 'Running...')}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {t('Manuell starten', 'Start manually')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {t('Letzter Sync', 'Last Sync')}
              </div>
              <p className="data-font text-lg text-foreground">
                {formatDate(status.lastRun)}
              </p>
              <div className="flex items-center gap-2">
                {status.lastRunSuccess ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t('Erfolgreich', 'Success')}
                  </Badge>
                ) : status.lastRun > 0 ? (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                    <XCircle className="w-3 h-3 mr-1" />
                    {t('Fehler', 'Error')}
                  </Badge>
                ) : null}
                {status.lastRunDuration > 0 && (
                  <span className="text-xs text-muted-foreground data-font">
                    {formatDuration(status.lastRunDuration)}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {t('Nächster Sync', 'Next Sync')}
              </div>
              <p className="data-font text-lg text-foreground">
                {formatDate(status.nextRun)}
              </p>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {getNextRunTime()}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lightning className="w-4 h-4" />
                {t('Statistiken', 'Statistics')}
              </div>
              <p className="data-font text-lg text-foreground">
                {status.artistsSynced} {t('Artists', 'Artists')}
              </p>
              {status.errorCount > 0 && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  {status.errorCount} {t('Fehler', 'Errors')}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-accent">
              {t('Einstellungen', 'Settings')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sync-time" className="text-sm">
                  {t('Sync-Zeit (24h Format)', 'Sync Time (24h format)')}
                </Label>
                <Input
                  id="sync-time"
                  type="time"
                  value={settings.syncTime}
                  onChange={(e) => handleUpdateSyncTime(e.target.value)}
                  className="data-font"
                />
                <p className="text-xs text-muted-foreground">
                  {t(
                    'Der Sync startet täglich zu dieser Zeit',
                    'Sync will start daily at this time'
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">
                  {t('Verzögerung zwischen Artists', 'Delay between artists')}
                </Label>
                <p className="data-font text-lg">
                  {settings.delayBetweenArtists}ms
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'Wartezeit zwischen API-Anfragen',
                    'Wait time between API requests'
                  )}
                </p>
              </div>
            </div>
          </div>

          {status.errorMessages && status.errorMessages.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-destructive">
                  {t('Letzte Fehler', 'Recent Errors')}
                </h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {status.errorMessages.map((error: string, index: number) => (
                    <div
                      key={index}
                      className="text-xs data-font text-muted-foreground bg-destructive/5 p-2 rounded border border-destructive/10"
                    >
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {history.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-accent">
                  {t('Sync-Verlauf (letzte 10)', 'Sync History (last 10)')}
                </h3>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {history.slice(-10).reverse().map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded bg-secondary/30 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        {entry.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                        <span className="text-xs data-font text-foreground">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs data-font text-muted-foreground">
                        <span>{entry.artistsSynced} {t('Artists', 'Artists')}</span>
                        <span>{formatDuration(entry.duration)}</span>
                        {entry.errorCount > 0 && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                            {entry.errorCount} {t('Fehler', 'Errors')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
