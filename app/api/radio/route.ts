import { NextResponse } from 'next/server';
import { tryCreateServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { matchesRadioGenre } from '@/lib/radio/genreSearch';

export const dynamic = 'force-dynamic';

type Station = {
  id: string; name: string; country: string | null; tags: string[];
  homepageUrl: string | null; healthStatus: string; lastMetadataAt: string | null;
  monitorEnabled: boolean; discoverySource: string;
};
type Track = { stationId: string; artist: string | null; title: string | null;
  observedAt: string; genres: string[]; matched: boolean };
type Ranked = { artist: string; title: string; spins: number; stations: number;
  countries: string[]; genres: string[]; lastDetected: string };

const FRESH_MS = 5 * 60_000;
function clean(value: string | null, max = 80) { return (value ?? '').trim().slice(0, max).toLocaleLowerCase(); }

export async function GET(request: Request) {
  const started = performance.now();
  const db = tryCreateServiceRoleSupabaseClient();
  if (!db) return NextResponse.json({ error: 'Radio service not configured' }, { status: 503 });
  const url = new URL(request.url);
  const view = ['stations','live','airplay'].includes(url.searchParams.get('view') ?? '')
    ? url.searchParams.get('view')! : 'stations';
  const genre = clean(url.searchParams.get('genre'));
  const country = clean(url.searchParams.get('country'), 2).toUpperCase();
  const q = clean(url.searchParams.get('q'));
  const days = [1,7,30].includes(Number(url.searchParams.get('days')))
    ? Number(url.searchParams.get('days')) : 7;
  const now = Date.now();
  const response = await db.from('radio_stations')
    .select('id,name,country,tags,homepageUrl,healthStatus,lastMetadataAt,monitorEnabled,discoverySource')
    .eq('isActive',true).eq('legalHold',false)
    .order('name',{ ascending:true }).limit(1000);
  if (response.error) return NextResponse.json({ error: 'Could not load radio stations' },{ status:503 });
  const stations = ((response.data ?? []) as Station[]).filter(s =>
    s.monitorEnabled || ['radio_browser','shoutcast'].includes(s.discoverySource));
  const tracks = new Map<string, Track>();
  if (view === 'live') {
    const { data, error } = await db.rpc('get_radio_live_tracks', {
      p_since: new Date(now-FRESH_MS).toISOString(),
    });
    if (error) return NextResponse.json({ error: 'Could not load live radio titles' }, { status:503 });
    for (const track of (data ?? []) as Track[]) tracks.set(track.stationId,track);
  }

  const items = stations.map(s => {
    const t = tracks.get(s.id);
    return {
      id:s.id,name:s.name,country:s.country,tags:s.tags ?? [],homepageUrl:s.homepageUrl,
      monitored:s.monitorEnabled,health:s.healthStatus,lastMetadataAt:s.lastMetadataAt,
      nowPlaying:t ? { artist:t.artist,title:t.title,detectedAt:t.observedAt,
        genres:t.genres ?? [],matched:t.matched } : null,
    };
  }).filter(s => {
    if (country && s.country?.toUpperCase() !== country) return false;
    if (view==='stations' && genre && !matchesRadioGenre(s.tags,genre)) return false;
    if (view==='live' && (!s.nowPlaying ||
      (genre && (!s.nowPlaying.matched || !matchesRadioGenre(s.nowPlaying.genres,genre))))) return false;
    if (q && view!=='airplay' && ![s.name,...s.tags,s.nowPlaying?.artist,s.nowPlaying?.title]
      .filter(Boolean).some(value => String(value).toLocaleLowerCase().includes(q))) return false;
    return true;
  });

  let charts: (Ranked & { rank:number })[] = [];
  if (view==='airplay') {
    const { data,error } = await db.rpc('get_radio_airplay_chart',{
      p_since:new Date(now-days*86_400_000).toISOString(),
      p_country:country,p_genre:genre,p_search:q,p_limit:50,
    });
    if (error) return NextResponse.json({ error:'Could not calculate radio airplay' },{ status:503 });
    charts=((data ?? []) as Ranked[]).map((item,index)=>({
      ...item,rank:index+1,spins:Number(item.spins),stations:Number(item.stations),
    }));
  }
  const elapsed=Math.round(performance.now()-started);
  return NextResponse.json({
    stations:items,charts,totalStations:stations.length,
    monitored:stations.filter(s=>s.monitorEnabled).length,days,view,
    coverage:{ aggregation:'full_period',sampleSize:null,totalEvents:null,truncated:false,
      sampledThrough:null,freshWindowSeconds:FRESH_MS/1000 },
    generatedAt:new Date(now).toISOString(),
  },{ headers:{
    'Cache-Control':'public, s-maxage=30, stale-while-revalidate=60',
    'Server-Timing':`radio;dur=${elapsed}`,
  }});
}
