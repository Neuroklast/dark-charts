import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../src/backend/lib/prisma';
import { logger } from '../../src/lib/logger';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  logger.info(`Incoming request: ${req.method} ${req.url}`, {
    method: req.method,
    path: req.url,
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Double check environment on server side too
  const isSpark = process.env.VITE_IS_SPARK === 'true' || req.headers.host?.includes('spark');
  if (!isSpark) {
    logger.warn('Spark bypass attempted in non-spark environment', { host: req.headers.host });
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const testUserEmail = 'spark-admin@darkcharts.local';

    // Check if test user exists
    let user = await prisma.user.findUnique({
      where: { email: testUserEmail },
    });

    if (!user) {
      // Create user
      user = await prisma.user.create({
        data: {
          email: testUserEmail,
          role: 'ADMIN',
        }
      });

      // Create a profile for the user since AuthContext expects it
      await prisma.fanProfile.create({
        data: {
          id: user.id,
          username: 'SparkAdmin',
          credits: 1000,
        }
      });
    }

    // Usually we would sign a real JWT here, but since this is a mock bypass
    // and AuthContext just stores the token to verify it later in /api/auth/me,
    // we return a dummy token and the user object for immediate local use.

    // Generate a dummy JWT-like string
    const dummyToken = `spark-bypass-jwt.${user.id}.${Date.now()}`;

    // Return the structure expected by AuthContext
    return res.status(200).json({
      success: true,
      token: dummyToken,
      user: {
        id: user.id,
        email: user.email,
        provider: 'mock',
        isAuthenticated: true,
        profile: {
          id: user.id,
          userType: user.role.toLowerCase(), // role is 'ADMIN'
          username: 'SparkAdmin',
          biography: '',
          externalLinks: [],
          displayedBadges: [],
          allBadges: [],
          isPublicProfile: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          votingCredits: 1000,
          votingHistory: [],
          favoritesList: [],
          personalCharts: [],
          curatedCharts: [],
          followingIds: [],
          followerIds: []
        }
      }
    });

  } catch (error) {
    logger.error('Error generating Spark bypass token', { error });
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
