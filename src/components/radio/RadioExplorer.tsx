'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { mainGenreMap } from '@/lib/config/genres';

type Track = {
  artist: string | null; title: string | null; detectedAt: string;
  genres: string[]; matched: boolean;
};
type Station = {
  id: string; name: string; country: string | null; tags: string[];
  homepageUrl: string | null; health: string; lastMetadataAt: string | null;
  nowPlaying: Track | null; monitored: boolean;
};
type ChartEntry = {
  rank: number; artist: string; title: string; spins: number;
  stations: number; countries: string[]; genres: string[]; lastDetected: string;
};
type RadioPayload = {
  stations: Station[]; charts: ChartEntry[]; totalStations: number; monitored: number;
  coverage: { sampleSize: number; totalEvents: number; truncated: boolean;
    sampledThrough: string | null; freshWindowSeconds: number };
  generatedAt: string;
};

const VIEWS = [
  { id: 'stations', label: 'Stations' },
  { id: 'live', label: 'Now playing' },
  { id: 'airplay', label: 'Radio airplay' },
] as const;
type View = (typeof VIEWS)[number]['id'];

const GENRES = ['All genres', ...new Set([
  ...Object.keys(mainGenreMap), ...Object.values(mainGenreMap).flat(),
  'Darkwave', 'Goth', 'Industrial', 'EBM', 'Synthpop', 'Dark Techno',
])].sort((a, b) => a === 'All genres' ? -1 : b === 'All genres' ? 1 : a.localeCompare(b));

export function RadioExplorer() {
  const [view, setView] = useState<View>('stations');
  const [genre, setGenre] = useState('');
  const [country, setCountry] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [days, setDays] = useState(7);
  const [payload, setPayload] = useState<RadioPayload | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async (signal?: AbortSignal) => {
    setPending(true);
    setError('');
    const params = new URLSearchParams({ view, days: String(days) });
    if (genre) params.set('genre', genre);
    if (country) params.set('country', country);
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    try {
      const response = await fetch(`/api/radio?${params.toString()}`, { signal, cache: 'no-store' });
      if (!response.ok) throw new Error('Radio information is temporarily unavailable');
      setPayload(await response.json() as RadioPayload);
    } catch (cause) {
      if (signal?.aborted) return;
      setError(cause instanceof Error ? cause.message : 'Could not load radio information');
    } finally {
      if (!signal?.aborted) setPending(false);
    }
  }, [view, genre, country, debouncedSearch, days]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const timer = window.setInterval(() => void load(controller.signal), 60_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [load]);

  return (
    <section className="space-y-7" aria-label="Internet radio explorer">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">RADIO INTELLIGENCE</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Global radio monitor</h1>
        <p className="max-w-3xl text-muted-foreground">
          Discover underground radio stations, follow current tracks and browse observed radio airplay.
          The station directory includes public candidates; live titles require active monitoring.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-border pb-3" aria-label="Radio sections">
        {VIEWS.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setView(tab.id)}
            aria-current={view === tab.id ? 'page' : undefined}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${view === tab.id
              ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Search
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Artist, track or station"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal text-foreground" />
        </label>
        <label className="space-y-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Genre
          <select value={genre} onChange={(event) => setGenre(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal text-foreground">
            {GENRES.map((tag) => <option key={tag} value={tag === 'All genres' ? '' : tag}>{tag}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Country code
          <input value={country} maxLength={2} onChange={(event) => setCountry(event.target.value.replace(/[^a-z]/gi, '').toUpperCase())}
            placeholder="All countries (e.g. DE)"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal text-foreground" />
        </label>
        <label className="space-y-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {view === 'airplay' ? 'Observation window' : 'Data window'}
          <select value={days} onChange={(event) => setDays(Number(event.target.value))}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal text-foreground">
            <option value={1}>24 hours</option>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span aria-live="polite">{pending ? 'Refreshing…' : payload
          ? `${payload.totalStations} listed · ${payload.monitored} monitored · Last updated ${new Date(payload.generatedAt).toLocaleTimeString()}`
          : 'Waiting for radio data'}</span>
        <button type="button" onClick={() => void load()} disabled={pending}
          className="rounded-md border border-border px-3 py-2 text-foreground hover:bg-muted disabled:opacity-40">
          Refresh now
        </button>
      </div>
      {error && <p role="alert" className="rounded-lg border border-destructive p-4 text-sm">{error}</p>}

      {payload && view === 'airplay' ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Recorded observations, not a census of all stations and not part of the Fan, Club or Combined charts.
            {payload.coverage.truncated && ' The observation limit was reached, so these rankings reflect only the most recent sample.'}
          </p>
          {payload.charts.length === 0 ? (
            <Empty label="No matched airplay observations for these filters." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="p-4">#</th><th className="p-4">Artist / track</th><th className="p-4">Observed plays</th><th className="p-4">Stations</th><th className="p-4">Countries</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payload.charts.map((item) => (
                    <tr key={`${item.artist}:${item.title}`} className="hover:bg-muted/20">
                      <td className="p-4 font-mono text-muted-foreground">{item.rank}</td>
                      <td className="p-4"><strong className="block">{item.artist}</strong><span className="text-muted-foreground">{item.title}</span></td>
                      <td className="p-4 font-mono">{item.spins}</td><td className="p-4">{item.stations}</td>
                      <td className="p-4">{item.countries.join(', ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : payload && payload.stations.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {payload.stations.map((station) => (
            <article key={station.id} className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold">{station.name}</h2>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {station.country && <span className="rounded bg-muted px-2 py-1">{station.country}</span>}
                    {station.monitored ? 'Monitored' : 'Directory'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{station.tags.slice(0, 5).join(' · ') || 'Genre unspecified'}</p>
                {station.nowPlaying ? (
                  <div className="border-l-2 border-primary pl-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">Last detected</span>
                    <p className="mt-1 font-semibold">{station.nowPlaying.artist ?? 'Unknown artist'}</p>
                    <p className="text-sm text-muted-foreground">{station.nowPlaying.title ?? 'Unknown title'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(station.nowPlaying.detectedAt).toLocaleTimeString()}
                      {!station.nowPlaying.matched && ' · Unverified catalog match'}
                    </p>
                  </div>
                ) : <p className="text-sm text-muted-foreground">No fresh title metadata available</p>}
              </div>
              {station.homepageUrl?.startsWith('https://') && (
                <a href={station.homepageUrl} target="_blank" rel="noopener noreferrer"
                  className="self-start text-sm font-medium text-primary hover:underline">Station website ↗</a>
              )}
            </article>
          ))}
        </div>
      ) : payload ? <Empty label={view === 'live'
        ? 'No live titles match these filters. Check again later or broaden the genre.'
        : 'No monitored stations match these filters. Add and enable stations in the admin radio monitor.'} /> : null}

      <footer className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        The directory includes curated public stream candidates, not every internet radio station. Genre filtering of stations uses broadcaster-provided tags. Genre filtering of live tracks and
        airplay uses matched artist or release genres, not station tags. Metadata may be delayed or missing.
        Coverage depends on participating public streams. Data refreshes every 60 seconds.
        <Link className="ml-2 underline hover:text-foreground" href="/methodology">Methodology</Link>
      </footer>
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{label}</div>;
}
