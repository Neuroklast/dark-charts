import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../src/backend/lib/auth-guard';
import { prisma } from '../../src/backend/lib/prisma';
import logger from '../../src/lib/logger';

// Mocked DB settings
let settings = {
  voiceCreditsBudget: 150,
  chartWeights: {
    fan: 0.5,
    expert: 0.35,
    streaming: 0.15
  }
};

async function handler(req: NextApiRequest, res: NextApiResponse, adminId: string) {
  if (req.method === 'GET') {
    return res.status(200).json({ settings });
  } else if (req.method === 'POST') {
    const { voiceCreditsBudget, chartWeights } = req.body;

    try {
      if (voiceCreditsBudget) settings.voiceCreditsBudget = voiceCreditsBudget;
      if (chartWeights) settings.chartWeights = { ...settings.chartWeights, ...chartWeights };

      await prisma.auditLog.create({
        data: {
          adminId,
          action: 'UPDATE_SYSTEM_SETTINGS',
          details: { voiceCreditsBudget, chartWeights }
        }
      });

      return res.status(200).json({ success: true, settings });
    } catch (error: any) {
      logger.error('Error updating settings', { error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}

export default withAdminAuth(handler);
