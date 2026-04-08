import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../src/backend/lib/prisma';
import { logger } from '../../src/lib/logger';
import { authService } from '../../src/backend/services/AuthService';
import { handleCors } from '../_lib/cors';
import { applyRateLimit } from '../_lib/rate-limit';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (handleCors(req, res, 'GET,OPTIONS')) return;
  if (!applyRateLimit(req, res, { maxRequests: 60 })) return;

  logger.info(`Incoming request: ${req.method} ${req.url}`, {
    method: req.method,
    path: req.url,
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await authService.verifyToken(token);

    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const { userId, role } = decodedToken;

    if (role !== 'FAN') {
       return res.status(200).json({ votes: [] });
    }

    const fanProfile = await prisma.fanProfile.findUnique({
      where: { userId },
    });

    if (!fanProfile) {
      return res.status(404).json({ error: 'Fan profile not found' });
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const votes = await prisma.vote.findMany({
      where: {
        fanId: fanProfile.id,
        createdAt: {
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
        createdAt: 'desc',
      },
    });

    const formattedVotes = votes.map((vote) => ({
      id: vote.id,
      releaseId: vote.releaseId,
      allocatedVotes: vote.allocatedVotes,
      cost: vote.cost,
      createdAt: vote.createdAt,
      release: {
        id: vote.release.id,
        title: vote.release.title,
        itunesArtworkUrl: vote.release.itunesArtworkUrl,
        artist: {
          id: vote.release.artist.id,
          name: vote.release.artist.name,
        },
      },
    }));

    return res.status(200).json({
      success: true,
      votes: formattedVotes,
      remainingCredits: fanProfile.remainingCredits,
    });
  } catch (error: any) {
    logger.error('Error fetching vote receipt', {
      error,
      method: req.method,
      path: req.url,
    });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  } finally {
    await prisma.$disconnect();
  }
}
