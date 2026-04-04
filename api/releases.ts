import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../src/backend/lib/prisma';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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
    const { id, limit = '20', offset = '0' } = req.query;

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

    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({ error: 'Offset must be non-negative' });
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
    console.error('Error fetching releases:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  } finally {
    await prisma.$disconnect();
  }
}
