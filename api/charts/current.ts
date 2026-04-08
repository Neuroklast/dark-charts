import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../src/backend/lib/prisma';
import { logger } from '../../src/lib/logger';
import { handleCors } from '../_lib/cors';
import { applyRateLimit } from '../_lib/rate-limit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res, 'GET,OPTIONS')) return;
  if (!applyRateLimit(req, res, { maxRequests: 120 })) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Find the latest completed week start
    const latestEntry = await prisma.chartEntry.findFirst({
      where: { chartType: 'combined' },
      orderBy: { weekStart: 'desc' },
    });

    if (!latestEntry) {
      return res.status(200).json({ success: true, entries: [], count: 0 });
    }

    const chartEntries = await prisma.chartEntry.findMany({
      where: {
        chartType: 'combined',
        weekStart: latestEntry.weekStart,
      },
      include: {
        release: {
          include: {
            artist: true,
          },
        },
      },
      orderBy: {
        placement: 'asc',
      },
    });

    const formattedEntries = chartEntries.map((entry) => ({
      id: entry.id,
      placement: entry.placement,
      score: entry.score,
      communityPower: entry.communityPower,
      movement: entry.movement,
      release: entry.release
        ? {
            id: entry.release.id,
            title: entry.release.title,
            releaseType: entry.release.releaseType,
            releaseDate: entry.release.releaseDate,
            spotifyId: entry.release.spotifyId,
            odesliLinks: entry.release.odesliLinks,
            itunesArtworkUrl: entry.release.itunesArtworkUrl,
            vercelBlobUrl: entry.release.vercelBlobUrl,
            artist: {
              id: entry.release.artist.id,
              name: entry.release.artist.name,
              spotifyId: entry.release.artist.spotifyId,
              genres: entry.release.artist.genres,
              bio: entry.release.artist.bio,
              profileLink: entry.release.artist.profileLink,
              imageUrl: entry.release.artist.imageUrl,
            },
          }
        : null,
      chartType: entry.chartType,
      weekStart: entry.weekStart,
      createdAt: entry.createdAt,
    }));

    return res.status(200).json({
      success: true,
      entries: formattedEntries,
      count: formattedEntries.length,
    });
  } catch (error) {
    logger.error('Error fetching current public charts', { error });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
