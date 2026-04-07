import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../src/backend/lib/auth-guard';
import { prisma } from '../../src/backend/lib/prisma';
import logger from '../../src/lib/logger';

async function handler(req: NextApiRequest, res: NextApiResponse, adminId: string) {
  if (req.method === 'GET') {
    try {
      const bookings = await prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } }
      });
      return res.status(200).json({ bookings });
    } catch (error: any) {
      logger.error('Error fetching admin promotions', { error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
    const { action, bookingId, status } = req.body;

    try {
      if (action === 'update_status' && bookingId && status) {
        const updated = await prisma.booking.update({
          where: { id: bookingId },
          data: { status }
        });

        await prisma.auditLog.create({
          data: {
            adminId,
            action: 'PROMOTION_STATUS_UPDATE',
            details: { bookingId, status }
          }
        });

        return res.status(200).json({ success: true, booking: updated });
      }
      return res.status(400).json({ error: 'Invalid action' });
    } catch (error: any) {
      logger.error('Error in promotion admin action', { error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}

export default withAdminAuth(handler);
