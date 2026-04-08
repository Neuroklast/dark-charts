import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../src/backend/lib/prisma';
import { z } from 'zod';
import { logger } from '../../src/lib/logger';
import { handleCors } from '../_lib/cors';
import { applyRateLimit } from '../_lib/rate-limit';

const querySchema = z.object({
  year: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(2020).max(2099)),
  week: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(53)),
});

/**
 * Convert an ISO year + week number to the Monday (UTC) that starts that week.
 * ISO week 1 is the week containing the first Thursday of the year (Jan 4 is
 * always in week 1 by definition).
 */
export function isoWeekToMonday(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay(); // 0 = Sun, 1 = Mon, …
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((dayOfWeek + 6) % 7) + (week - 1) * 7);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/** Returns the Monday of the current ISO week (UTC midnight). */
export function getCurrentWeekMonday(): Date {
  const now = new Date();
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res, 'GET,OPTIONS')) return;
  if (!applyRateLimit(req, res, { maxRequests: 120 })) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parseResult = querySchema.safeParse(req.query);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid parameters',
        details: parseResult.error.format(),
      });
    }

    const { year, week } = parseResult.data;
    const weekStart = isoWeekToMonday(year, week);
    const currentMonday = getCurrentWeekMonday();

    if (weekStart >= currentMonday) {
      const isCurrent = weekStart.getTime() === currentMonday.getTime();
      return res.status(400).json({
        error: isCurrent
          ? 'Cannot access currently running week'
          : 'Cannot access future week',
      });
    }

    const entries = await prisma.chartEntry.findMany({
      where: { weekStart },
      include: {
        release: {
          include: { artist: true },
        },
      },
      orderBy: { placement: 'asc' },
    });

    const formattedEntries = entries.map((entry) => ({
      id: entry.id,
      placement: entry.placement,
      score: entry.score,
      communityPower: entry.communityPower,
      movement: entry.movement,
      chartType: entry.chartType,
      weekStart: entry.weekStart,
      createdAt: entry.createdAt,
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
    }));

    return res.status(200).json({
      success: true,
      year,
      week,
      weekStart: weekStart.toISOString(),
      entries: formattedEntries,
      count: formattedEntries.length,
    });
  } catch (error) {
    logger.error('Error fetching chart history', {
      error,
      method: req.method,
      path: req.url,
      query: req.query,
    });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
