import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../src/backend/lib/prisma';
import { z } from 'zod';
import { logger } from '../src/lib/logger';

const querySchema = z.object({
  type: z.enum(['fan', 'expert', 'streaming', 'combined']),
  limit: z.string().optional().default('10').transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(100)),
  completed: z.string().optional().transform(val => val === 'true')
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  logger.info(`Incoming request: ${req.method} ${req.url}`, {
    method: req.method,
    path: req.url,
  });

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parseResult = querySchema.safeParse(req.query);

    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid parameters', details: parseResult.error.format() });
    }

    const { type, limit: limitNum, completed } = parseResult.data;

    const now = new Date();
    let targetWeekStart = new Date(now);
    targetWeekStart.setDate(now.getDate() - now.getDay());
    targetWeekStart.setHours(0, 0, 0, 0);

    if (completed) {
      // Find the most recent week start that has actual aggregated chart entries
      const latestEntry = await prisma.chartEntry.findFirst({
        where: { chartType: type as string },
        orderBy: { weekStart: 'desc' },
      });
      if (latestEntry) {
        targetWeekStart = latestEntry.weekStart;
      } else {
        // Fallback: previous week
        targetWeekStart.setDate(targetWeekStart.getDate() - 7);
      }
    }

    const chartEntries = await prisma.chartEntry.findMany({
      where: {
        chartType: type as string,
        weekStart: targetWeekStart,
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
      take: limitNum,
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
      chartType: type,
      entries: formattedEntries,
      count: formattedEntries.length,
    });
  } catch (error) {
    const authHeader = req.headers.authorization;
    let userId = undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        userId = 'extracted-from-token-placeholder';
      } catch (e) {
        // ignore
      }
    }

    logger.error('Error fetching charts', {
      error,
      method: req.method,
      path: req.url,
      query: req.query,
      userId,
    });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
