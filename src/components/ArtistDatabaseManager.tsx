import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Database, CheckCircle, XCircle, Download, Upload } from '@phosphor-icons/react';
import { artistDatabaseService, type Artist } from '@/services/artistDatabaseService';
import { toast } from 'sonner';

export function ArtistDatabaseManager() {
  const [csvText, setCsvText] = useState('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [corrections, setCorrections] = useState<any[]>([]);

  const handleLoadCSV = async () => {
    if (!csvText.trim()) {
      toast.error('Bitte CSV-Daten einfügen');
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      await artistDatabaseService.loadFromCSV(csvText);
      setProgress(25);
      
      const loadedArtists = artistDatabaseService.getArtists();
      setArtists(loadedArtists);
      setProgress(100);
      
      toast.success(`${loadedArtists.length} Artists geladen`);
    } catch (error) {
      console.error('Error loading CSV:', error);
      toast.error('Fehler beim Laden der CSV');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyAndCorrect = async () => {
    if (artists.length === 0) {
      toast.error('Bitte zuerst CSV laden');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const foundCorrections = await artistDatabaseService.verifyAndCorrect();
      setCorrections(foundCorrections);
      
      const updatedArtists = artistDatabaseService.getArtists();
      setArtists(updatedArtists);
      setProgress(100);
      
      if (foundCorrections.length > 0) {
        toast.warning(`${foundCorrections.length} Spotify IDs korrigiert`);
      } else {
        toast.success('Alle Spotify IDs sind korrekt');
      }
    } catch (error) {
      console.error('Error verifying artists:', error);
      toast.error('Fehler bei der Verifizierung');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnrichWithReleases = async () => {
    if (artists.length === 0) {
      toast.error('Bitte zuerst CSV laden');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      await artistDatabaseService.enrichWithReleases();
      
      const enrichedArtists = artistDatabaseService.getArtists();
      setArtists(enrichedArtists);
      setProgress(100);
      
      toast.success('Releases erfolgreich geladen');
    } catch (error) {
      console.error('Error enriching with releases:', error);
      toast.error('Fehler beim Laden der Releases');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (artists.length === 0) {
      toast.error('Keine Artists zum Speichern vorhanden');
      return;
    }

    setIsProcessing(true);

    try {
      await artistDatabaseService.saveToKV();
      toast.success('Artists in Datenbank gespeichert');
    } catch (error) {
      console.error('Error saving to database:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadCorrectedCSV = () => {
    if (artists.length === 0) {
      toast.error('Keine Artists zum Exportieren vorhanden');
      return;
    }

    const csvContent = artistDatabaseService.getCorrectedCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'darkcharts_artists_corrected.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV heruntergeladen');
  };

  const handleLoadFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      toast.success('CSV-Datei geladen');
    };
    reader.readAsText(file);
  };

  const verifiedCount = artists.filter(a => a.verified).length;
  const withReleasesCount = artists.filter(a => a.latestRelease).length;

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database size={32} className="text-primary" />
          <div>
            <h2 className="display-font text-2xl uppercase text-foreground tracking-tight font-semibold">
              Artist Datenbank Manager
            </h2>
            <p className="text-sm text-muted-foreground font-ui mt-1">
              CSV laden, Spotify IDs verifizieren und Artists in Datenbank speichern
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 font-ui">
              CSV-Datei hochladen oder Text einfügen
            </label>
            <div className="flex gap-2 mb-2">
              <Button
                onClick={() => document.getElementById('csv-file-input')?.click()}
                variant="outline"
                size="sm"
                disabled={isProcessing}
              >
                <Upload size={16} className="mr-2" />
                Datei wählen
              </Button>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleLoadFromFile}
                className="hidden"
              />
            </div>
            <Textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="CSV-Inhalt hier einfügen..."
              className="font-mono text-xs h-64"
              disabled={isProcessing}
            />
          </div>

          {isProcessing && (
            <div>
              <Progress value={progress} className="mb-2" />
              <p className="text-xs text-muted-foreground font-ui text-center">
                Verarbeitung läuft... {Math.round(progress)}%
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={handleLoadCSV}
              disabled={isProcessing || !csvText.trim()}
              className="w-full"
            >
              1. CSV Laden
            </Button>
            <Button
              onClick={handleVerifyAndCorrect}
              disabled={isProcessing || artists.length === 0}
              className="w-full"
            >
              2. IDs Prüfen
            </Button>
            <Button
              onClick={handleEnrichWithReleases}
              disabled={isProcessing || artists.length === 0}
              className="w-full"
            >
              3. Releases Laden
            </Button>
            <Button
              onClick={handleSaveToDatabase}
              disabled={isProcessing || artists.length === 0}
              className="w-full"
            >
              4. Speichern
            </Button>
          </div>

          {artists.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/30 border border-border">
              <div>
                <p className="text-xs text-muted-foreground font-ui uppercase tracking-wider">
                  Gesamt
                </p>
                <p className="text-2xl font-bold text-foreground font-ui">
                  {artists.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-ui uppercase tracking-wider">
                  Verifiziert
                </p>
                <p className="text-2xl font-bold text-accent font-ui">
                  {verifiedCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-ui uppercase tracking-wider">
                  Mit Releases
                </p>
                <p className="text-2xl font-bold text-primary font-ui">
                  {withReleasesCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-ui uppercase tracking-wider">
                  Korrekturen
                </p>
                <p className="text-2xl font-bold text-destructive font-ui">
                  {corrections.length}
                </p>
              </div>
            </div>
          )}

          {corrections.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-ui text-sm font-semibold text-foreground uppercase tracking-wider">
                  Spotify ID Korrekturen
                </h3>
                <Button
                  onClick={handleDownloadCorrectedCSV}
                  variant="outline"
                  size="sm"
                >
                  <Download size={16} className="mr-2" />
                  CSV Download
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 border border-border p-3 bg-secondary/20">
                {corrections.map((correction, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs font-mono p-2 bg-card border border-border"
                  >
                    <XCircle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-foreground font-semibold">{correction.artistName}</p>
                      <p className="text-muted-foreground">
                        Alt: {correction.oldId}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-accent flex-shrink-0" />
                      <p className="text-accent">
                        {correction.newId}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {artists.length > 0 && (
            <div>
              <h3 className="font-ui text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                Geladene Artists ({artists.length})
              </h3>
              <div className="max-h-96 overflow-y-auto space-y-1 border border-border p-3 bg-secondary/20">
                {artists.slice(0, 50).map((artist, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs font-ui p-2 bg-card border border-border/50"
                  >
                    {artist.verified ? (
                      <CheckCircle size={16} className="text-accent flex-shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-destructive flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-semibold truncate">{artist.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {artist.country} · {artist.label}
                      </p>
                    </div>
                    {artist.latestRelease && (
                      <div className="text-primary text-xs font-mono">
                        {artist.latestRelease.releaseDate}
                      </div>
                    )}
                  </div>
                ))}
                {artists.length > 50 && (
                  <p className="text-xs text-muted-foreground text-center py-2 font-ui">
                    ... und {artists.length - 50} weitere
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
