'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';
import { DEFAULT_RADIO_MONITOR_SETTINGS, type RadioMonitorSettings } from '@/lib/radio/constants';
import {
  RadioMonitorView,
  type RadioEventRow,
  type RadioMonitorStats,
  type RadioStationRow,
} from './RadioMonitorView';

interface StationsResponse {
  stations: RadioStationRow[];
  heartbeatStale?: boolean;
  stats?: RadioMonitorStats;
}

export function RadioMonitorContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const [stations, setStations] = useState<RadioStationRow[]>([]);
  const [events, setEvents] = useState<RadioEventRow[]>([]);
  const [settings, setSettings] = useState<RadioMonitorSettings>(DEFAULT_RADIO_MONITOR_SETTINGS);
  const [stats, setStats] = useState<RadioMonitorStats>({ total: 0, monitored: 0, dead: 0, blocked: 0 });
  const [heartbeatStale, setHeartbeatStale] = useState(false);
  const [unmatchedOnly, setUnmatchedOnly] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualNowPlayingUrl, setManualNowPlayingUrl] = useState('');
  const [discoverTags, setDiscoverTags] = useState(DEFAULT_RADIO_MONITOR_SETTINGS.genreTags.join(', '));
  const [discoverCountry, setDiscoverCountry] = useState('');
  const [discoverySource, setDiscoverySource] = useState<'radio_browser' | 'shoutcast'>('radio_browser');

  const loadStations = useCallback(async () => {
    const res = await authFetch('/api/admin/radio/stations');
    if (!res.ok) throw new Error('stations');
    const data = (await res.json()) as StationsResponse;
    setStations(data.stations ?? []);
    setHeartbeatStale(Boolean(data.heartbeatStale));
    setStats(data.stats ?? { total: 0, monitored: 0, dead: 0, blocked: 0 });
  }, []);

  const loadEvents = useCallback(async (unmatched: boolean) => {
    const res = await authFetch(`/api/admin/radio/events${unmatched ? '?unmatched=1' : ''}`);
    if (!res.ok) throw new Error('events');
    const data = (await res.json()) as { events?: RadioEventRow[] };
    setEvents(data.events ?? []);
  }, []);

  const loadSettings = useCallback(async () => {
    const res = await authFetch('/api/admin/radio/settings');
    if (!res.ok) throw new Error('settings');
    const data = (await res.json()) as { settings?: RadioMonitorSettings };
    if (data.settings) {
      setSettings(data.settings);
      setDiscoverTags(data.settings.genreTags.join(', '));
    }
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadStations(), loadEvents(unmatchedOnly), loadSettings()]);
    } catch {
      toast.error('Failed to load radio monitor');
    } finally {
      setIsLoading(false);
    }
  }, [loadEvents, loadSettings, loadStations, unmatchedOnly]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const patchStation = async (id: string, patch: Record<string, unknown>) => {
    const previous = stations.find(station => station.id === id);
    if (!previous) throw new Error('Station not found');
    setStations(list => list.map(station => station.id === id ? { ...station, ...patch } : station));
    if (typeof patch.monitorEnabled === 'boolean' && patch.monitorEnabled !== previous.monitorEnabled) {
      setStats(value => ({ ...value, monitored: value.monitored + (patch.monitorEnabled ? 1 : -1) }));
    }
    try {
      const res = await authFetch(`/api/admin/radio/stations/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || 'Station update failed');
      }
      const payload = await res.json() as { station: RadioStationRow };
      setStations(list => list.map(station => station.id === id ? payload.station : station));
    } catch (error) {
      setStations(list => list.map(station => station.id === id ? previous : station));
      if (typeof patch.monitorEnabled === 'boolean' && patch.monitorEnabled !== previous.monitorEnabled) {
        setStats(value => ({ ...value, monitored: value.monitored + (previous.monitorEnabled ? 1 : -1) }));
      }
      throw error;
    }
  };

  return (
    <RadioMonitorView
      isLoading={isLoading}
      heartbeatStale={heartbeatStale}
      stats={stats}
      stations={stations}
      events={events}
      settings={settings}
      unmatchedOnly={unmatchedOnly}
      discoverTags={discoverTags}
      discoverCountry={discoverCountry}
      discoverySource={discoverySource}
      onDiscoverTagsChange={setDiscoverTags}
      onDiscoverCountryChange={setDiscoverCountry}
      onDiscoverySourceChange={setDiscoverySource}
      manualName={manualName}
      manualUrl={manualUrl}
      manualNowPlayingUrl={manualNowPlayingUrl}
      onManualNowPlayingUrlChange={setManualNowPlayingUrl}
      onManualNameChange={setManualName}
      onManualUrlChange={setManualUrl}
      onSettingsChange={setSettings}
      onUnmatchedChange={(value) => {
        setUnmatchedOnly(value);
        void loadEvents(value);
      }}
      onDeleteStation={(id) => {
        void authFetch(`/api/admin/radio/stations/${id}`, { method: 'DELETE' }).then(async (res) => {
          if (!res.ok) throw new Error('delete');
          setStations(list => list.filter(station => station.id !== id));
          setStats(value => ({ ...value, total: Math.max(0, value.total - 1),
            monitored: Math.max(0, value.monitored - (stations.find(station => station.id === id)?.monitorEnabled ? 1 : 0)) }));
          toast.success('Radio station deleted');
        }).catch(() => toast.error('Failed to delete station'));
      }}
      onSaveStation={(id, patch) => {
        void patchStation(id, patch).then(() => toast.success('Radio station updated'))
          .catch(() => toast.error('Failed to update station'));
      }}
      onToggleMonitor={(id, enabled) => {
        void patchStation(id, { monitorEnabled: enabled }).catch(() =>
          toast.error('Failed to update station')
        );
      }}
      onToggleLegalHold={(id, hold) => {
        void patchStation(id, { legalHold: hold }).catch(() => toast.error('Failed to update station'));
      }}
      onSaveSettings={async (next) => {
        const res = await authFetch('/api/admin/radio/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        });
        if (!res.ok) {
          toast.error('Failed to save settings');
          return;
        }
        toast.success('Radio monitor settings saved');
      }}
      onDiscover={async () => {
        const res = await authFetch('/api/admin/radio/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: discoverySource,
            tags: discoverTags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
            country: discoverCountry || undefined, limit: 300 }),
        });
        if (!res.ok) {
          toast.error('Discovery failed');
          return;
        }
        const data = (await res.json()) as { upserted?: number };
        toast.success(`Imported ${data.upserted ?? 0} candidates`);
        await loadStations();
      }}
      onAddStation={async () => {
        const res = await authFetch('/api/admin/radio/stations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: manualName, streamUrl: manualUrl,
            nowPlayingUrl: manualNowPlayingUrl || undefined }),
        });
        if (!res.ok) {
          toast.error('Could not add station');
          return;
        }
        setManualName('');
        setManualUrl('');
        setManualNowPlayingUrl('');
        toast.success('Station added as a candidate');
        await loadStations();
      }}
    />
  );
}
