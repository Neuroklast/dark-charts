import { NextResponse } from 'next/server';
import { tryCreateServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { matchesRadioGenre } from '@/lib/radio/genreSearch';

// Only verified, actively monitored stations are published. Candidate streams remain private.
export const dynamic = 'force-dynamic';

type Station = {
  id: string;
  name: string;
  country: string | null;
  tags: string[];
  homepageUrl: string | null;
  healthStatus: string;
  lastMetadataAt: string | null;
};
type Relation = { name?: string; title?: string; genres?: string[] } | null;
type Event = {
  sourceStationId: string | null;
  rawArtist: string | null;
  rawTitle: string | null;
  artistId: string | null;
  releaseId: string | null;
  confidence: number;
  observedAt: string;
  artists: Relation;
  releases: Relation;
};

const PAGE_SIZE = 1000;
const EVENT_LIMIT = 5000;
const FRESH_MS = 5 * 60 * 1000;

function clean(value: string | null, max = 80): string {
  return (value ?? '').trim().slice(0, max).toLocaleLowerCase();
}

function eventGenres(event: Event): string[] {
  return [...(event.artists?.genres ?? []), ...(event.releases?.genres ?? [])];
}

export async function GET(request: Request) {
  const db = tryCreateServiceRoleSupabaseClient();
  if (!db) return NextResponse.json({ error: 'Radio service not configured' }, { status: 503 });

  const url = new URL(request.url);
  const genre = clean(url.searchParams.get('genre'));
  const country = clean(url.searchParams.get('country'), 2).toUpperCase();
  const q = clean(url.searchParams.get('q'));
  const view = ['stations', 'live', 'airplay'].includes(url.searchParams.get('view') ?? '')
    ? url.searchParams.get('view')!
    : 'stations';
  const days = [1, 7, 30].includes(Number(url.searchParams.get('days')))
    ? Number(url.searchParams.get('days'))
    : 7;
  const now = Date.now();
  const from = new Date(now - days * 86_400_000).toISOString();

  const { data: stationRows, error: stationError } = await db
    .from('radio_stations')
    .select('id,name,country,tags,homepageUrl,healthStatus,lastMetadataAt')
    .eq('monitorEnabled', true).eq('isActive', true).eq('legalHold', false)
    .order('name', { ascending: true }).limit(1000);
  if (stationError) return NextResponse.json({ error: 'Could not load radio stations' }, { status: 503 });

  const stations = (stationRows ?? []) as Station[];
  const stationMap = new Map(stations.map((station) => [station.id, station]));
  // Query just the observed sample; keep this separate from every official chart pillar.
  const { data, error, count } = await db
    .from('airplay_events')
    .select('sourceStationId,rawArtist,rawTitle,artistId,releaseId,confidence,observedAt,artists(name,genres),releases(title,genres)', { count: 'exact' })
    .eq('source', 'radio')
    .gte('observedAt', from)
    .order('observedAt', { ascending: false })
    .limit(EVENT_LIMIT);
  if (error) return NextResponse.json({ error: 'Could not load airplay observations' }, { status: 503 });
  const events = (data ?? []) as unknown as Event[];

  const latest = new Map<string, Event>();
  for (const event of events) {
    if (event.sourceStationId && stationMap.has(event.sourceStationId) && !latest.has(event.sourceStationId)) {
      latest.set(event.sourceStationId, event);
    }
  }

  const items = stations.map((station) => {
    const event = latest.get(station.id);
    const fresh = event && now - Date.parse(event.observedAt) <= FRESH_MS &&
      station.lastMetadataAt && now - Date.parse(station.lastMetadataAt) <= FRESH_MS;
    const track = fresh && event ? {
      artist: event.artists?.name ?? event.rawArtist ?? null,
      title: event.rawTitle,
      detectedAt: event.observedAt,
      genres: eventGenres(event),
      matched: event.confidence >= 0.85 && !!event.artistId,
    } : null;
    return {
      id: station.id, name: station.name, country: station.country,
      tags: station.tags ?? [], homepageUrl: station.homepageUrl,
      health: station.healthStatus, lastMetadataAt: station.lastMetadataAt,
      nowPlaying: track,
    };
  }).filter((station) => {
    if (country && station.country?.toUpperCase() !== country) return false;
    const tags = station.tags ?? [];
    if (genre && (view === 'stations'
      ? !matchesRadioGenre(tags, genre)
      : !station.nowPlaying || !station.nowPlaying.matched ||
        !matchesRadioGenre(station.nowPlaying.genres, genre))) return false;
    if (view === 'live' && !station.nowPlaying) return false;
    if (q && ![station.name, ...tags, station.nowPlaying?.artist, station.nowPlaying?.title]
      .filter(Boolean).some((value) => String(value).toLocaleLowerCase().includes(q))) return false;
    return true;
  });

  const ranked = new Map<string, {
    artist: string; title: string; spins: number; stationIds: Set<string>; countries: Set<string>;
    genres: string[]; lastDetected: string;
  }>();
  if (view === 'airplay') {
    for (const event of events) {
      const station = event.sourceStationId ? stationMap.get(event.sourceStationId) : undefined;
      if (!station || !event.artistId || event.confidence < 0.85) continue;
      if (country && station.country?.toUpperCase() !== country) continue;
      const genres = eventGenres(event);
      if (!matchesRadioGenre(genres, genre)) continue;
      const artist = event.artists?.name ?? event.rawArtist ?? '';
      const title = event.releases?.title ?? event.rawTitle ?? '';
      if (!artist || !title) continue;
      if (q && !(`${artist} ${title}`).toLocaleLowerCase().includes(q)) continue;
      const key = event.releaseId ?? `${event.artistId}:${title.toLocaleLowerCase()}`;
      const row = ranked.get(key) ?? {
        artist, title, spins: 0, stationIds: new Set<string>(),
        countries: new Set<string>(), genres, lastDetected: event.observedAt,
      };
      row.spins++;
      row.stationIds.add(station.id);
      if (station.country) row.countries.add(station.country);
      ranked.set(key, row);
    }
  }

  const charts = [...ranked.values()].sort((a, b) => b.spins - a.spins)
    .slice(0, 50).map((row, index) => ({
      rank: index + 1, artist: row.artist, title: row.title,
      spins: row.spins, stations: row.stationIds.size,
      countries: [...row.countries].sort(), genres: row.genres,
      lastDetected: row.lastDetected,
    }));

  return NextResponse.json({
    stations: items.slice(0, 1000), charts, totalStations: stations.length,
    monitored: stations.length, days, view,
    coverage: { sampleSize: events.length, totalEvents: count ?? events.length,
      truncated: (count ?? 0) > events.length,
      sampledThrough: events.at(-1)?.observedAt ?? null,
      freshWindowSeconds: FRESH_MS / 1000 },
    generatedAt: new Date(now).toISOString(),
  }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } });
}
