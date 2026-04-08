import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../src/backend/lib/prisma';
import { logger } from '../src/lib/logger';
import { handleCors } from './_lib/cors';
import { applyRateLimit } from './_lib/rate-limit';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (handleCors(request, response, 'GET,OPTIONS')) return;
  if (!applyRateLimit(request, response, { maxRequests: 30 })) return;

  logger.info(`Incoming request: ${request.method} ${request.url}`, {
    method: request.method,
    path: request.url,
  });

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
      logger.error('Database connection error', {
        error,
        method: request.method,
        path: request.url,
        query: request.query,
      });
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
