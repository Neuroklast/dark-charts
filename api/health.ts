import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../src/backend/lib/prisma';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method === 'GET') {
    try {
      // Test database connectivity
      const userCount = await prisma.user.count();
      return response.status(200).json({
        status: 'ok',
        message: 'Serverless backend is operational',
        timestamp: new Date().toISOString(),
        dbStatus: `Connected. Users in database: ${userCount}`,
      });
    } catch (error) {
      console.error('Database connection error:', error);
      return response.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return response.status(405).json({
    status: 'error',
    message: `Method ${request.method} Not Allowed`,
  });
}
