import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';

export const GET = withAdminAuth(async (req) => {
  const week = req.nextUrl.searchParams.get('week');
  const limit = Math.min(100, Math.max(10, parseInt(req.nextUrl.searchParams.get('limit') || '10', 10) || 10));
  const page = Math.min(10000, Math.max(0, Number(req.nextUrl.searchParams.get('page')) || 0));
  const supabase = createServiceRoleSupabaseClient();

  let query = supabase
    .from('vote_anomalies')
    .select('*, release:releases(id, title, artist:artists(name))', { count: 'exact' })
    .order('createdAt', { ascending: false }).order('id', { ascending: true })
    .range(page * limit, page * limit + limit - 1);

  if (week) {
    query = query.eq('weekStart', week);
  }

  const { data, error, count } = await query;
  if (error) throw new ApiError(500, error.message);

  return NextResponse.json({ success: true, anomalies: data ?? [], total: count ?? 0, page, limit });
});

export const POST = withAdminAuth(async (req, adminId) => {
  const body = await req.json();
  const { anomalyId, resolved } = body ?? {};

  if (!anomalyId || typeof resolved !== 'boolean') {
    throw new ApiError(400, 'anomalyId and resolved are required');
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('vote_anomalies')
    .update({ resolved })
    .eq('id', anomalyId)
    .select()
    .single();

  if (error) throw new ApiError(500, error.message);

  await supabase.from('audit_logs').insert({
    adminId,
    action: resolved ? 'ANOMALY_RESOLVED' : 'ANOMALY_REOPENED',
    details: { anomalyId },
  });

  return NextResponse.json({ success: true, anomaly: data });
});