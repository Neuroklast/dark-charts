import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdminAuth } from '../../src/backend/lib/auth-guard';
import { prisma } from '../../src/backend/lib/prisma';
import { logger } from '../../src/lib/logger';

async function handler(req: VercelRequest, res: VercelResponse, adminId: string) {
  if (req.method === 'GET') {
    try {
      const blacklist = await prisma.artist.findMany({
        where: { status: { in: ['RESTRICTED', 'BANNED'] } },
        orderBy: { updatedAt: 'desc' }
      });
      return res.status(200).json({ blacklist });
    } catch (error: any) {
      logger.error('Error fetching artist blacklist', { error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
    const { action, artistId, status } = req.body;

    if (!action) return res.status(400).json({ error: 'Action is required' });

    try {
      if (action === 'update_status' && artistId && status) {
        const updated = await prisma.artist.update({
          where: { id: artistId },
          data: { status }
        });

        await prisma.auditLog.create({
          data: {
            adminId,
            action: 'ARTIST_STATUS_UPDATE',
            details: { artistId, status }
          }
        });

        return res.status(200).json({ success: true, artist: updated });
      } else if (action === 'force_sync') {
         // Mocked sync action
         await prisma.auditLog.create({
            data: { adminId, action: 'FORCE_ARTIST_SYNC', details: {} }
         });
         return res.status(200).json({ success: true, message: 'Sync triggered' });
      } else {
        return res.status(400).json({ error: 'Invalid action or missing parameters' });
      }
    } catch (error: any) {
      logger.error('Error in artist admin action', { error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}

export default withAdminAuth(handler);
