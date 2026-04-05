import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../src/backend/lib/prisma';

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
    const { type, limit = '10' } = req.query;

    if (!type || (type !== 'fan' && type !== 'expert' && type !== 'streaming')) {
      return res.status(400).json({ error: 'Invalid chart type' });
    }

    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

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
