import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../src/backend/lib/auth-guard';
import { prisma } from '../../src/backend/lib/prisma';
import logger from '../../src/lib/logger';

// Mock global state for emergency pause, normally this would be in DB or Redis
let isVotingPaused = false;

async function handler(req: NextApiRequest, res: NextApiResponse, adminId: string) {
  if (req.method === 'GET') {
    try {
      const recentCharts = await prisma.chartEntry.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { release: { include: { artist: true } } }
      });
      return res.status(200).json({ charts: recentCharts, isVotingPaused });
    } catch (error: any) {
      logger.error('Error fetching admin charts', { error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
    const { action } = req.body;

    try {
      if (action === 'toggle_pause') {
        isVotingPaused = !isVotingPaused;

        await prisma.auditLog.create({
          data: {
            adminId,
            action: isVotingPaused ? 'VOTING_PAUSED' : 'VOTING_RESUMED',
            details: {}
          }
        });

        return res.status(200).json({ success: true, isVotingPaused });
      } else if (action === 'recalculate_week') {
         await prisma.auditLog.create({
            data: { adminId, action: 'RECALCULATE_CHARTS', details: { weekStart: req.body.weekStart } }
         });
         return res.status(200).json({ success: true, message: 'Recalculation started' });
      }
      return res.status(400).json({ error: 'Invalid action' });
    } catch (error: any) {
      logger.error('Error in chart admin action', { error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}

export default withAdminAuth(handler);
