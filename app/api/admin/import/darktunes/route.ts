import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/adminAuth';
import { ApiError } from '@/lib/errors';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { importDarktunesCatalog } from '@/lib/catalog/importDarktunes';
import { logger } from '@/lib/logger';

const bodySchema = z.object({
  artists: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        spotifyId: z.string().nullable().optional(),
        itunesId: z.string().nullable().optional(),
        appleMusicUrl: z.string().nullable().optional(),
        genres: z.array(z.string()).optional(),
        bio: z.string().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
        profileLink: z.string().nullable().optional(),
        country: z.string().nullable().optional(),
        isVisible: z.boolean().optional(),
      })
    )
    .optional()
    .default([]),
  releases: z
    .array(
      z.object({
        id: z.string().optional(),
        artistName: z.string().optional(),
        artistId: z.string().optional(),
        artistSpotifyId: z.string().nullable().optional(),
        title: z.string().min(1),
        releaseDate: z.string().min(4),
        releaseType: z.string().optional(),
        albumType: z.enum(['album', 'single', 'ep', 'compilation']).nullable().optional(),
        totalTracks: z.number().int().nullable().optional(),
        spotifyId: z.string().nullable().optional(),
        itunesId: z.string().nullable().optional(),
        appleMusicUrl: z.string().nullable().optional(),
        artworkUrl: z.string().nullable().optional(),
        itunesArtworkUrl: z.string().nullable().optional(),
        highResArtworkUrl: z.string().nullable().optional(),
        r2ArtworkUrl: z.string().nullable().optional(),
        genres: z.array(z.string()).optional(),
        label: z.string().nullable().optional(),
        isVisible: z.boolean().optional(),
        platformLinks: z.record(z.string(), z.unknown()).nullable().optional(),
        odesliLinks: z.record(z.string(), z.unknown()).nullable().optional(),
      })
    )
    .optional()
    .default([]),
  enqueueSync: z.boolean().optional().default(true),
});

/**
 * POST /api/admin/import/darktunes
 * Body: { artists: [...], releases: [...], enqueueSync?: boolean }
 * Idempotent catalog import from a darktunes export snapshot.
 */
export const POST = withAdminAuth(async (req: NextRequest) => {
  const json = await req.json();
  const parseResult = bodySchema.safeParse(json);
  if (!parseResult.success) {
    throw new ApiError(400, 'Invalid import payload', 'VALIDATION_ERROR');
  }

  if (
    parseResult.data.artists.length === 0 &&
    parseResult.data.releases.length === 0
  ) {
    throw new ApiError(400, 'No artists or releases provided');
  }

  const db = createServiceRoleSupabaseClient();
  const result = await importDarktunesCatalog(db, parseResult.data);

  logger.info('darktunes catalog import completed', {
    artistsCreated: result.artistsCreated,
    artistsUpdated: result.artistsUpdated,
    releasesCreated: result.releasesCreated,
    releasesUpdated: result.releasesUpdated,
    errors: result.errors.length,
  });

  return NextResponse.json({
    success: true,
    ...result,
  });
});
