import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authService } from '../../src/backend/services/AuthService';
import { handleCors } from '../_lib/cors';
import { applyRateLimit } from '../_lib/rate-limit';
import { logger } from '../../src/lib/logger';
import { prisma } from '../../src/backend/lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res, 'POST,OPTIONS')) return;
  if (!applyRateLimit(req, res, { windowMs: 60_000, maxRequests: 10 })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await authService.login({ email, password });

    // Fetch role profile to enrich the response
    const user = await prisma.user.findUnique({
      where: { id: result.user.id },
      include: {
        fanProfile: true,
        djProfile: true,
        bandProfile: true,
        labelProfile: true,
      },
    });

    return res.status(200).json({
      success: true,
      token: result.token,
      user: {
        ...result.user,
        fanProfile: user?.fanProfile ?? null,
        djProfile: user?.djProfile ?? null,
        bandProfile: user?.bandProfile ?? null,
        labelProfile: user?.labelProfile ?? null,
      },
    });
  } catch (error: any) {
    logger.error('Login failed', { error: error.message });
    return res.status(401).json({ error: 'Invalid credentials' });
  } finally {
    await prisma.$disconnect();
  }
}
