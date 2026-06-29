import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, ApiError } from '@/lib/errors';
import { requireAuth } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  accessToken: z.string().min(10),
});

const MIN_TOP_ARTISTS = 3;

export const POST = withErrorHandler(async (req: NextRequest) => {
  const decoded = await requireAuth(req);
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(400, 'Valid Spotify access token required');
  }

  const { accessToken } = parsed.data;

  const [artistsRes, tracksRes] = await Promise.all([
    fetch(
      'https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    ),
    fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    ),
  ]);

  if (!artistsRes.ok) {
    throw new ApiError(400, 'Failed to read Spotify listening history. Re-authorize with top-read scope.');
  }

  const artistsData = await artistsRes.json();
  const tracksData = tracksRes.ok ? await tracksRes.json() : { items: [] };

  const topArtistIds = (artistsData.items ?? []).map((a: { id: string }) => a.id);
  const topTrackIds = (tracksData.items ?? []).map((t: { id: string }) => t.id);

  if (topArtistIds.length < MIN_TOP_ARTISTS) {
    throw new ApiError(
      400,
      `Insufficient listening history (need at least ${MIN_TOP_ARTISTS} top artists)`
    );
  }

  const supabase = createServiceRoleSupabaseClient();

  await supabase.from('user_listening_snapshots').insert({
    userId: decoded.userId,
    provider: 'spotify',
    topArtistIds,
    topTrackIds,
    checkedAt: new Date().toISOString(),
  });

  const { error: updateError } = await supabase
    .from('users')
    .update({
      trustLevel: 3,
      authProvider: 'spotify',
      updatedAt: new Date().toISOString(),
    })
    .eq('id', decoded.userId);

  if (updateError) {
    throw new ApiError(500, updateError.message);
  }

  return NextResponse.json({
    success: true,
    trustLevel: 3,
    topArtists: topArtistIds.length,
    topTracks: topTrackIds.length,
  });
});