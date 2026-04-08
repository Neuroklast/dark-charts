import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authService } from '../../src/backend/services/AuthService';
import { prisma } from '../../src/backend/lib/prisma';
import { handleCors } from '../_lib/cors';
import { logger } from '../../src/lib/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res, 'GET,OPTIONS')) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = await authService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        fanProfile: {
          select: { id: true, nickname: true, credits: true, remainingCredits: true, avatarUrl: true },
        },
        djProfile: {
          select: { id: true, bio: true, soundcloudLink: true, expertStatus: true, reputationScore: true },
        },
        bandProfile: {
          select: { id: true, artistId: true, members: true },
        },
        labelProfile: {
          select: { id: true, companyName: true, website: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        isDemo: decoded.isDemo ?? false,
      },
    });
  } catch (error) {
    logger.error('Error fetching current user', { error });
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
