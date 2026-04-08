import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verify } from 'jsonwebtoken';
import { prisma } from './prisma';
import { logger } from '../../lib/logger';

interface JwtPayload {
  userId: string;
  role: string;
  exp: number;
}

export async function withAdminAuth(
  handler: (req: VercelRequest, res: VercelResponse, adminId: string) => Promise<void | VercelResponse>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET environment variable is not set');
      return res.status(503).json({ error: 'Service unavailable: authentication is not configured' });
    }
    const JWT_SECRET = process.env.JWT_SECRET;
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.error('Unauthorized access attempt: No Bearer token provided');
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
      }

      const token = authHeader.split(' ')[1];

      if (!token) {
        logger.error('Unauthorized access attempt: Token missing from Bearer header');
        return res.status(401).json({ error: 'Unauthorized: Token missing' });
      }

      let decoded: JwtPayload;
      try {
        decoded = verify(token, JWT_SECRET) as JwtPayload;
      } catch (err: any) {
        logger.error('Unauthorized access attempt: Invalid token', { error: err.message });
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
      }

      if (!decoded || !decoded.userId || decoded.role !== 'ADMIN') {
        logger.error('Forbidden access attempt: Insufficient permissions', { userId: decoded?.userId, role: decoded?.role });
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      // Verify user exists and is still an admin in the database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true }
      });

      if (!user) {
        logger.error('Forbidden access attempt: User not found in database', { userId: decoded.userId });
        return res.status(403).json({ error: 'Forbidden: User no longer exists' });
      }

      if (user.role !== 'ADMIN') {
        logger.error('Forbidden access attempt: User role revoked in database', { userId: decoded.userId, dbRole: user.role });
        return res.status(403).json({ error: 'Forbidden: Admin privileges revoked' });
      }

      // Pass control to the handler if authorized
      await handler(req, res, decoded.userId);

    } catch (error: any) {
      logger.error('Internal server error during auth validation', { error: error.message, stack: error.stack });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
