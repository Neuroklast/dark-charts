import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../src/backend/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  type: z.enum(['fan', 'expert', 'streaming']),
  limit: z.string().optional().default('10').transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(100))
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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

    const { type, limit: limitNum } = parseResult.data;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const chartEntries = await prisma.chartEntry.findMany({
      where: {
        chartType: type as string,
        weekStart: {
          gte: startOfWeek,
        },
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
    console.error('Error fetching charts:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
