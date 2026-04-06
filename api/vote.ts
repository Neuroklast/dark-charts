import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../src/backend/lib/prisma';
import { z } from 'zod';
import { logger } from '../src/lib/logger';
import { authService } from '../src/backend/services/AuthService';
import { calculateVoteCost } from '../src/lib/math/quadratic';

const bodySchema = z.object({
  releaseId: z.string().min(1, "releaseId is required"),
  votes: z.number().int().min(1).optional(),
  rank: z.number().int().min(1).max(10).optional(),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  logger.info(`Incoming request: ${req.method} ${req.url}`, {
    method: req.method,
    path: req.url,
  });

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await authService.verifyToken(token);

    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const { userId, role } = decodedToken;

    if (role !== 'FAN' && role !== 'DJ') {
      return res.status(403).json({ error: 'Forbidden: Role not authorized to vote' });
    }

    const parseResult = bodySchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid body parameters', details: parseResult.error.format() });
    }

    const { releaseId, votes, rank } = parseResult.data;

    const release = await prisma.release.findUnique({
      where: { id: releaseId },
    });

    if (!release) {
      return res.status(404).json({ error: 'Release not found' });
    }

    if (role === 'FAN') {
      if (votes === undefined) {
        return res.status(400).json({ error: 'votes is required for FAN role' });
      }

      const cost = calculateVoteCost(votes);

      const fanProfile = await prisma.fanProfile.findUnique({
        where: { userId },
      });

      if (!fanProfile) {
        return res.status(404).json({ error: 'Fan profile not found' });
      }

      if (fanProfile.remainingCredits < cost) {
        return res.status(400).json({ error: 'Insufficient credits' });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Decrease remaining credits first
        const updatedFan = await tx.fanProfile.update({
          where: { id: fanProfile.id },
          data: {
            remainingCredits: {
              decrement: cost,
            },
          },
        });

        // Ensure no negative credits due to race condition
        if (updatedFan.remainingCredits < 0) {
          throw new Error('Insufficient credits during transaction');
        }

        const existingVote = await tx.vote.findUnique({
          where: {
            fanId_releaseId: {
              fanId: fanProfile.id,
              releaseId,
            },
          },
        });

        let updatedVote;
        if (existingVote) {
          updatedVote = await tx.vote.update({
            where: {
              fanId_releaseId: {
                fanId: fanProfile.id,
                releaseId,
              },
            },
            data: {
              allocatedVotes: {
                increment: votes,
              },
              cost: {
                increment: cost,
              },
              // maintaining backwards compat fields if needed, but not required by prompt
              votes: {
                increment: votes,
              },
              credits: {
                increment: cost,
              }
            },
          });
        } else {
          updatedVote = await tx.vote.create({
            data: {
              fanId: fanProfile.id,
              releaseId,
              allocatedVotes: votes,
              cost: cost,
              votes: votes,
              credits: cost,
            },
          });
        }

        return { updatedVote, remainingCredits: updatedFan.remainingCredits };
      });

      return res.status(200).json({
        success: true,
        vote: result.updatedVote,
        remainingCredits: result.remainingCredits,
      });

    } else if (role === 'DJ') {
      if (rank === undefined) {
        return res.status(400).json({ error: 'rank is required for DJ role' });
      }

      const djProfile = await prisma.dJProfile.findUnique({
        where: { userId },
      });

      if (!djProfile) {
        return res.status(404).json({ error: 'DJ profile not found' });
      }

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const existingExpertVoteWithRank = await prisma.expertVote.findFirst({
        where: {
          djId: djProfile.id,
          rank: rank,
          createdAt: {
            gte: startOfWeek,
          },
        },
      });

      if (existingExpertVoteWithRank && existingExpertVoteWithRank.releaseId !== releaseId) {
        return res.status(400).json({ error: 'You have already assigned this rank to another release this week' });
      }

      const updatedExpertVote = await prisma.expertVote.upsert({
        where: {
          djId_releaseId: {
            djId: djProfile.id,
            releaseId,
          },
        },
        update: {
          rank: rank,
          rating: rank, // dummy value to satisfy existing non-null schema if it exists? Rating is actually a float.
          createdAt: new Date(), // update date so it counts for this week
        },
        create: {
          djId: djProfile.id,
          releaseId,
          rank: rank,
          rating: rank, // fallback
        },
      });

      return res.status(200).json({
        success: true,
        vote: updatedExpertVote,
      });
    }

  } catch (error: any) {
    logger.error('Error processing vote', {
      error,
      method: req.method,
      path: req.url,
      body: req.body,
    });

    if (error.message === 'Insufficient credits during transaction') {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  } finally {
    await prisma.$disconnect();
  }
}
