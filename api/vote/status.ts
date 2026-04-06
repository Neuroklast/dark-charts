import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../src/backend/lib/prisma';
import { logger } from '../../src/lib/logger';
import { authService } from '../../src/backend/services/AuthService';

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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
       return res.status(200).json({ hasVoted: false });
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

    const voteCount = await prisma.vote.count({
      where: {
        fanId: fanProfile.id,
        createdAt: {
          gte: startOfWeek,
        },
      },
    });

    return res.status(200).json({
      success: true,
      hasVoted: voteCount > 0,
    });
  } catch (error: any) {
    logger.error('Error fetching vote status', {
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
