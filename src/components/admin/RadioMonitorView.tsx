'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RadioMonitorSettings } from '@/lib/radio/constants';
import { DEFAULT_RADIO_GENRE_TAGS } from '@/lib/radio/constants';

export interface RadioStationRow {
  id: string;
  name: string;
  country: string | null;
  healthStatus: string;
  monitorEnabled: boolean;
  legalHold: boolean;
  lastError: string | null;
  lastMetadataAt: string | null;
  tags: string[];
  streamUrl: string | null;
  nowPlayingUrl: string | null;
  metadataMode: string;
  probeIntervalSeconds: number;
}

export interface RadioEventRow {
  stationName?: string | null;
  rawTitle?: string | null;
  artistName?: string | null;
  releaseTitle?: string | null;
  confidence: number;
  detectionMethod?: string | null;
  observedAt: string;
}

export interface RadioMonitorStats {
  total: number;
  monitored: number;
  dead: number;
  blocked: number;
}

interface RadioMonitorViewProps {
  isLoading?: boolean;
  heartbeatStale?: boolean;
  stats?: RadioMonitorStats;
  stations?: RadioStationRow[];
  events?: RadioEventRow[];
  settings?: RadioMonitorSettings;
  unmatchedOnly?: boolean;
  discoverTags?: string;
  discoverCountry?: string;
  discoverySource?: 'radio_browser' | 'shoutcast';
  onDiscoverTagsChange?: (value: string) => void;
  onDiscoverCountryChange?: (value: string) => void;
  onDiscoverySourceChange?: (value: 'radio_browser' | 'shoutcast') => void;
  manualName?: string;
  manualUrl?: string;
  manualNowPlayingUrl?: string;
  onManualNowPlayingUrlChange?: (value: string) => void;
  onDeleteStation?: (id: string) => void;
  onSaveStation?: (id: string, patch: { streamUrl: string | null; nowPlayingUrl: string | null; metadataMode: string; probeIntervalSeconds: number }) => void;
  onToggleMonitor?: (id: string, enabled: boolean) => void;
  onToggleLegalHold?: (id: string, hold: boolean) => void;
  onUnmatchedChange?: (value: boolean) => void;
  onSaveSettings?: (settings: RadioMonitorSettings) => void;
  onDiscover?: () => void;
  onAddStation?: () => void;
  onManualNameChange?: (value: string) => void;
  onManualUrlChange?: (value: string) => void;
  onSettingsChange?: (settings: RadioMonitorSettings) => void;
  initialTab?: string;
}

export function RadioMonitorView({
  isLoading,
  heartbeatStale,
  stats,
  stations = [],
  events = [],
  settings,
  unmatchedOnly = false,
  discoverTags,
  discoverCountry = '',
  discoverySource = 'radio_browser',
  onDiscoverTagsChange,
  onDiscoverCountryChange,
  onDiscoverySourceChange,
  manualName = '',
  manualUrl = '',
  manualNowPlayingUrl = '',
  onManualNowPlayingUrlChange,
  onDeleteStation,
  onSaveStation,
  onToggleMonitor,
  onToggleLegalHold,
  onUnmatchedChange,
  onSaveSettings,
  onDiscover,
  onAddStation,
  onManualNameChange,
  onManualUrlChange,
  onSettingsChange,
  initialTab = 'overview',
}: RadioMonitorViewProps) {
  const [editingStation, setEditingStation] = useState<string | null>(null);
  const [editStreamUrl, setEditStreamUrl] = useState('');
  const [editNowPlayingUrl, setEditNowPlayingUrl] = useState('');
  const [editMode, setEditMode] = useState('auto');
  const [editInterval, setEditInterval] = useState(45);

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="radio-monitor-loading">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {heartbeatStale && (
        <Card className="p-4 border-amber-800 bg-amber-950/30 text-sm">
          The radio worker heartbeat is stale. Metadata probes are not running until the Docker worker is up.
        </Card>
      )}

      <Tabs defaultValue={initialTab}>
        <TabsList aria-label="Radio monitor sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stations">Stations</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3 pt-4">
          <p className="text-sm text-muted-foreground">
            Dark Charts monitors relevant, publicly reachable dark-scene radios. Coverage is not a census of all internet radio.
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Stations" value={stats?.total ?? 0} />
            <Stat label="Monitored" value={stats?.monitored ?? 0} />
            <Stat label="Dead" value={stats?.dead ?? 0} />
            <Stat label="Blocked" value={stats?.blocked ?? 0} />
          </div>
        </TabsContent>

        <TabsContent value="stations" className="space-y-4 pt-4">
          <form
            className="flex flex-col sm:flex-row gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              onAddStation?.();
            }}
          >
            <Input
              aria-label="Station name"
              placeholder="Station name"
              value={manualName}
              onChange={(event) => onManualNameChange?.(event.target.value)}
            />
            <Input
              aria-label="Stream URL"
              placeholder="https://example.com/stream"
              value={manualUrl}
              onChange={(event) => onManualUrlChange?.(event.target.value)}
            />
            <Input
              aria-label="Now-playing JSON URL (optional)"
              placeholder="Now-playing JSON URL (optional)"
              value={manualNowPlayingUrl}
              onChange={(event) => onManualNowPlayingUrlChange?.(event.target.value)}
            />
            <Button type="submit">Add</Button>
          </form>
          <Card className="p-0 overflow-x-auto">
            <Table>
              <TableCaption>Public stream candidates and monitored stations</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Monitor</TableHead>
                  <TableHead>Legal hold</TableHead>
                  <TableHead>Last error</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stations.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell>
                      <div className="font-medium">{station.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {station.country ?? '—'} {station.tags.slice(0, 3).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{station.healthStatus}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`monitor-${station.id}`}
                          checked={station.monitorEnabled}
                          onCheckedChange={(checked) => onToggleMonitor?.(station.id, checked)}
                          aria-label={`Monitor ${station.name}`}
                        />
                        <Label htmlFor={`monitor-${station.id}`} className="sr-only">
                          Monitor {station.name}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        id={`hold-${station.id}`}
                        checked={station.legalHold}
                        onCheckedChange={(checked) => onToggleLegalHold?.(station.id, checked)}
                        aria-label={`Legal hold ${station.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[16rem] truncate">
                      {station.lastError ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          setEditingStation(station.id);
                          setEditStreamUrl(station.streamUrl ?? '');
                          setEditNowPlayingUrl(station.nowPlayingUrl ?? '');
                          setEditMode(station.metadataMode);
                          setEditInterval(station.probeIntervalSeconds);
                        }}>Configure</Button>
                        <Button type="button" variant="destructive" size="sm" onClick={() => {
                          if (window.confirm(`Delete radio station ${station.name}?`)) onDeleteStation?.(station.id);
                        }}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          {editingStation && (
            <Card className="space-y-3 p-4">
              <h3 className="font-semibold">Configure {stations.find((item) => item.id === editingStation)?.name}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1"><Label htmlFor="edit-stream-url">Stream URL</Label>
                  <Input id="edit-stream-url" value={editStreamUrl} onChange={(event) => setEditStreamUrl(event.target.value)} /></div>
                <div className="space-y-1"><Label htmlFor="edit-now-url">Now-playing API URL</Label>
                  <Input id="edit-now-url" placeholder="Optional AzuraCast / Radio.co JSON URL" value={editNowPlayingUrl}
                    onChange={(event) => setEditNowPlayingUrl(event.target.value)} /></div>
                <div className="space-y-1"><Label htmlFor="edit-mode">Metadata mode</Label>
                  <select id="edit-mode" value={editMode} onChange={(event) => setEditMode(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {['auto', 'nowplaying_url', 'icecast_json', 'shoutcast_stats', 'icy'].map((mode) =>
                      <option value={mode} key={mode}>{mode}</option>)}
                  </select>
                </div>
                <div className="space-y-1"><Label htmlFor="edit-interval">Probe interval (seconds)</Label>
                  <Input id="edit-interval" type="number" min={15} max={600} value={editInterval}
                    onChange={(event) => setEditInterval(Number(event.target.value))} /></div>
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={() => {
                  onSaveStation?.(editingStation, {
                    streamUrl: editStreamUrl.trim() || null,
                    nowPlayingUrl: editNowPlayingUrl.trim() || null,
                    metadataMode: editMode,
                    probeIntervalSeconds: editInterval,
                  });
                  setEditingStation(null);
                }}>Save station</Button>
                <Button type="button" variant="outline" onClick={() => setEditingStation(null)}>Cancel</Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-3 pt-4">
          <p className="text-sm text-muted-foreground">
            Search public directories. Results land as candidates; nothing is probed until you enable monitoring.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor="discover-tags">Genres / tags (comma separated, up to 20)</Label>
              <Input id="discover-tags" value={discoverTags ?? DEFAULT_RADIO_GENRE_TAGS.join(', ')}
                onChange={(event) => onDiscoverTagsChange?.(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="discover-country">Country (ISO code, optional)</Label>
              <Input id="discover-country" placeholder="DE" maxLength={2} value={discoverCountry}
                onChange={(event) => onDiscoverCountryChange?.(event.target.value.replace(/[^a-z]/gi, '').toUpperCase())} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="discover-source">Directory</Label>
              <select id="discover-source" value={discoverySource}
                onChange={(event) => onDiscoverySourceChange?.(event.target.value as 'radio_browser' | 'shoutcast')}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="radio_browser">Radio Browser</option><option value="shoutcast">SHOUTcast (API key needed)</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={() => onDiscover?.()} className="w-full">Discover stations</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Candidates are added with monitoring disabled. Review the station list before enabling probes.</p>
        </TabsContent>

        <TabsContent value="events" className="space-y-3 pt-4">
          <div className="flex items-center gap-2">
            <Switch
              id="unmatched-only"
              checked={unmatchedOnly}
              onCheckedChange={(checked) => onUnmatchedChange?.(checked)}
              aria-label="Unmatched only"
            />
            <Label htmlFor="unmatched-only">Unmatched only</Label>
          </div>
          <Card className="p-0 overflow-x-auto">
            <Table>
              <TableCaption>Recent now-playing detections</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Raw title</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event, index) => (
                  <TableRow key={`${event.observedAt}-${index}`}>
                    <TableCell className="whitespace-nowrap text-xs">{event.observedAt}</TableCell>
                    <TableCell>{event.stationName ?? '—'}</TableCell>
                    <TableCell>{event.rawTitle ?? '—'}</TableCell>
                    <TableCell>
                      {event.artistName
                        ? `${event.artistName}${event.releaseTitle ? ` — ${event.releaseTitle}` : ''}`
                        : 'unmatched'}
                    </TableCell>
                    <TableCell>{event.confidence.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 pt-4">
          {settings && (
            <>
              <div className="flex items-center gap-2">
                <Switch
                  id="monitor-enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => onSettingsChange?.({ ...settings, enabled: checked })}
                />
                <Label htmlFor="monitor-enabled">Master enable (also requires the feature flag)</Label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField
                  id="interval"
                  label="Probe interval (seconds)"
                  value={settings.defaultProbeIntervalSeconds}
                  onChange={(value) =>
                    onSettingsChange?.({ ...settings, defaultProbeIntervalSeconds: value })
                  }
                />
                <NumberField
                  id="concurrency"
                  label="Max concurrent probes"
                  value={settings.maxConcurrentProbes}
                  onChange={(value) => onSettingsChange?.({ ...settings, maxConcurrentProbes: value })}
                />
                <NumberField
                  id="cap"
                  label="Max monitored stations"
                  value={settings.maxMonitoredStations}
                  onChange={(value) => onSettingsChange?.({ ...settings, maxMonitoredStations: value })}
                />
                <NumberField
                  id="confidence"
                  label="Min match confidence"
                  value={settings.minMatchConfidence}
                  step="0.01"
                  onChange={(value) => onSettingsChange?.({ ...settings, minMatchConfidence: value })}
                />
              </div>
              <Button type="button" onClick={() => onSaveSettings?.(settings)}>
                Save settings
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </Card>
  );
}

function NumberField({
  id,
  label,
  value,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  step?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
