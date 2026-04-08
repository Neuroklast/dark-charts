import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdminAuth } from '../../src/backend/lib/auth-guard';
import { prisma } from '../../src/backend/lib/prisma';
import { logger } from '../../src/lib/logger';

async function handler(req: VercelRequest, res: VercelResponse, adminId: string) {
  if (req.method === 'GET') {
    try {
      // Get counts for metrics
      const [activeUsersCount, fanCount, djCount, artistCount] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'FAN' } }),
        prisma.user.count({ where: { role: 'DJ' } }),
        prisma.artist.count(),
      ]);

      // Return mocked Vercel/Quota metrics alongside real database stats
      return res.status(200).json({
        metrics: {
          users: {
            total: activeUsersCount,
            fans: fanCount,
            djs: djCount
          },
          artists: artistCount,
          cronJobs: {
            chartAggregation: 'healthy',
            dataImport: 'healthy',
            spotifySync: 'warning'
          },
          apiQuotas: {
            spotify: { used: 4500, limit: 10000 },
            youtube: { used: 8000, limit: 10000, status: 'warning' }
          }
        }
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
