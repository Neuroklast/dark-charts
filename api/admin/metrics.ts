import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdminAuth } from '../../src/backend/lib/auth-guard';
import { prisma } from '../../src/backend/lib/prisma';
import { logger } from '../../src/lib/logger';

async function handler(req: VercelRequest, res: VercelResponse, adminId: string) {
  if (req.method === 'GET') {
    try {
      // Parallel DB queries for metrics
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const [
        totalUsers,
        fanCount,
        djCount,
        bandCount,
        labelCount,
        artistCount,
        releaseCount,
        votesThisWeek,
        expertVotesThisWeek,
        recentAuditLogs,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'FAN' } }),
        prisma.user.count({ where: { role: 'DJ' } }),
        prisma.user.count({ where: { role: 'BAND' } }),
        prisma.user.count({ where: { role: 'LABEL' } }),
        prisma.artist.count(),
        prisma.release.count(),
        prisma.vote.count({ where: { createdAt: { gte: weekStart } } }),
        prisma.expertVote.count({ where: { createdAt: { gte: weekStart } } }),
        prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            admin: { select: { email: true } },
          },
        }),
      ]);

      // Check which optional external APIs are configured
      const apiHealth = {
        database: { status: 'ok', message: 'Connected' },
        spotify: {
          status: process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET ? 'configured' : 'not_configured',
          message: process.env.SPOTIFY_CLIENT_ID ? 'API credentials set' : 'SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set',
        },
        jwt: {
          status: process.env.JWT_SECRET ? 'ok' : 'error',
          message: process.env.JWT_SECRET ? 'Secret configured' : 'JWT_SECRET missing',
        },
        adminInit: {
          status: process.env.ADMIN_EMAIL ? 'configured' : 'not_configured',
          message: process.env.ADMIN_EMAIL ? 'Admin email set' : 'ADMIN_EMAIL not set',
        },
      };

      return res.status(200).json({
        metrics: {
          users: {
            total: totalUsers,
            fans: fanCount,
            djs: djCount,
            bands: bandCount,
            labels: labelCount,
          },
          artists: artistCount,
          releases: releaseCount,
          voting: {
            fanVotesThisWeek: votesThisWeek,
            expertVotesThisWeek: expertVotesThisWeek,
          },
          apiHealth,
          recentAuditLogs: recentAuditLogs.map(log => ({
            id: log.id,
            action: log.action,
            adminEmail: log.admin.email,
            details: log.details,
            createdAt: log.createdAt.toISOString(),
          })),
        },
      });
    } catch (error: any) {
      logger.error('Error fetching admin metrics', { error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}

export default withAdminAuth(handler);
