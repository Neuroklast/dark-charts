import type { VercelRequest, VercelResponse } from '@vercel/node';
import { promotionService } from '../src/backend/services/PromotionService';
import { logger } from '../src/lib/logger';
import { handleCors } from './_lib/cors';
import { applyRateLimit } from './_lib/rate-limit';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (handleCors(req, res, 'GET,OPTIONS')) return;
  if (!applyRateLimit(req, res, { maxRequests: 120 })) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const promotions = await promotionService.getActivePromotions();
    return res.status(200).json({ success: true, promotions });
  } catch (error) {
    logger.error('Error fetching promotions', { error });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
