import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../src/backend/lib/prisma';
import { z } from 'zod';
import { logger } from '../src/lib/logger';

const querySchema = z.object({
  id: z.string().optional(),
  limit: z.string().optional().default('20').transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(100)),
  offset: z.string().optional().default('0').transform((val) => parseInt(val, 10)).pipe(z.number().min(0))
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  logger.info(`Incoming request: ${req.method} ${req.url}`, {
    method: req.method,
    path: req.url,
  });

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    const { id, limit: limitNum, offset: offsetNum } = parseResult.data;

    if (id) {
      const release = await prisma.release.findUnique({
        where: { id: id as string },
        include: {
          artist: true,
          chartEntries: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
      });

      if (!release) {
        return res.status(404).json({ error: 'Release not found' });
      }

      return res.status(200).json({
        success: true,
        release,
      });
    }

    const releases = await prisma.release.findMany({
      include: {
        artist: true,
      },
      orderBy: {
        releaseDate: 'desc',
      },
      take: limitNum,
      skip: offsetNum,
    });

    const total = await prisma.release.count();

    return res.status(200).json({
      success: true,
      releases,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total,
      },
    });
  } catch (error) {
    // Attempt to extract userId from Auth headers or cookies if they existed
    // For this mock, we try to grab it from a mock header, but in reality it'd come from session middleware
    const authHeader = req.headers.authorization;
    let userId = undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Normally decode JWT to get userId. Let's just pass the token for debug, or assume userId is somehow available.
        // As a placeholder, we can log that a token was present.
        userId = 'extracted-from-token-placeholder';
      } catch (e) {
        // ignore
      }
    }

    logger.error('Error fetching releases', {
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
  } finally {
    await prisma.$disconnect();
  }
}
