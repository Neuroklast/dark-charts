import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdminAuth } from '../../src/backend/lib/auth-guard';
import { prisma } from '../../src/backend/lib/prisma';
import { logger } from '../../src/lib/logger';

async function handler(req: VercelRequest, res: VercelResponse, adminId: string) {
  if (req.method === 'GET') {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            fanProfile: { select: { nickname: true, remainingCredits: true } },
            djProfile: { select: { expertStatus: true, reputationScore: true } }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count()
      ]);

      return res.status(200).json({
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      logger.error('Error fetching admin users', { error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
    const { action, userId, role, credits } = req.body;

    if (!action || !userId) {
      return res.status(400).json({ error: 'Missing action or userId' });
    }

    try {
      let updatedUser;

      if (action === 'update_role' && role) {
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { role }
        });
      } else if (action === 'reset_credits' && credits !== undefined) {
         updatedUser = await prisma.fanProfile.update({
           where: { userId },
           data: { remainingCredits: credits }
         });
      } else if (action === 'suspend') {
         // Suspend logic (for now, simply changing role or status if available, but since there's no status on user, let's assume we remove them or demote them or create a suspension flag in future, for now demote to FAN)
         updatedUser = await prisma.user.update({
           where: { id: userId },
           data: { role: 'FAN' }
         });
      } else {
         return res.status(400).json({ error: 'Invalid action' });
      }

      // Log the action
      await prisma.auditLog.create({
        data: {
          adminId,
          action: `USER_ACTION_${action.toUpperCase()}`,
          details: { userId, role, credits }
        }
      });

      return res.status(200).json({ success: true, user: updatedUser });
    } catch (error: any) {
      logger.error('Error modifying user', { error: error.message, action, userId });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}

export default withAdminAuth(handler);
