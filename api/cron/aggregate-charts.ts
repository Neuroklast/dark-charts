import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chartAggregationService } from '../../src/backend/services/ChartAggregationService';
import { logger } from '../../src/lib/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Verify the Vercel Cron Secret
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Calculate the most recent Monday
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    await chartAggregationService.aggregateChartsForWeek(weekStart);

    logger.info('Weekly charts aggregated successfully', { weekStart });

    return res.status(200).json({ success: true, message: 'Charts aggregated successfully' });
  } catch (error) {
    logger.error('Error aggregating weekly charts via cron', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
