import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/adminAuth';
import { ApiError } from '@/lib/errors';
import { isPublicStreamUrl } from '@/lib/radio/publicEndpoint';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import {
  createManualStation,
  getHeartbeat,
  isHeartbeatStale,
} from '@/lib/radio/stationRepository';

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  streamUrl: z.string().url(),
  country: z.string().trim().max(8).optional().nullable(),
  nowPlayingUrl: z.string().url().optional().nullable(),
});

export const GET = withAdminAuth(async (req) => {
  const db = createServiceRoleSupabaseClient();
  const page = Math.min(10000, Math.max(0, Number(req.nextUrl.searchParams.get('page')) || 0));
  const size = Math.min(100, Math.max(10, Number(req.nextUrl.searchParams.get('size')) || 25));
  const search = (req.nextUrl.searchParams.get('search') ?? '').trim().slice(0, 80)
    .replace(/[%_\\]/g, match => '\\' + match);
  let query = db.from('radio_stations')
    .select('id,name,country,healthStatus,monitorEnabled,legalHold,lastError,lastMetadataAt,tags,streamUrl,nowPlayingUrl,metadataMode,probeIntervalSeconds',
      { count:'exact' })
    .order('name', { ascending:true }).order('id', { ascending:true })
    .range(page * size, page * size + size - 1);
  if (search) query = query.ilike('name', `%${search}%`);
  const [items, heartbeat, monitored, dead, blocked, all] = await Promise.all([
    query, getHeartbeat(db),
    db.from('radio_stations').select('id',{ count:'exact',head:true }).eq('monitorEnabled',true),
    db.from('radio_stations').select('id',{ count:'exact',head:true }).eq('healthStatus','dead'),
    db.from('radio_stations').select('id',{ count:'exact',head:true }).eq('healthStatus','blocked'),
    db.from('radio_stations').select('id',{ count:'exact',head:true }),
  ]);
  if (items.error || monitored.error || dead.error || blocked.error || all.error)
    throw new ApiError(503,'Unable to list radio stations');
  return NextResponse.json({
    stations:items.data ?? [],total:items.count ?? 0,page,size,
    heartbeat,heartbeatStale:isHeartbeatStale(heartbeat?.seenAt),
    stats:{ total:all.count ?? 0,monitored:monitored.count ?? 0,
      dead:dead.count ?? 0,blocked:blocked.count ?? 0 },
  });
});

export const POST = withAdminAuth(async (req, adminId) => {
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid station', 'VALIDATION_ERROR');
  }
  if (!isPublicStreamUrl(parsed.data.streamUrl) ||
      (parsed.data.nowPlayingUrl && !isPublicStreamUrl(parsed.data.nowPlayingUrl))) {
    throw new ApiError(400, 'Station URLs must be public HTTP(S) endpoints', 'VALIDATION_ERROR');
  }
  const supabase = createServiceRoleSupabaseClient();
  const station = await createManualStation(supabase, parsed.data);
  await supabase.from('audit_logs').insert({
    adminId,
    action: 'RADIO_STATION_CREATE',
    details: { stationId: station.id, name: station.name },
  });
  return NextResponse.json({ station }, { status: 201 });
});
