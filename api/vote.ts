import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../src/backend/lib/prisma';
import { z } from 'zod';
import { logger } from '../src/lib/logger';
import { authService } from '../src/backend/services/AuthService';
import { calculateVoteCost } from '../src/lib/math/quadratic';

const bodySchema = z.object({
  type: z.literal("bulk").optional(),
  votes: z.record(z.string(), z.number().int().min(1)).optional(),
  // Single vote fallback / DJ support:
  releaseId: z.string().optional(),
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

    const { type, votes, releaseId, rank } = parseResult.data;

    if (role === 'FAN') {
      if (type === 'bulk' && votes) {
        // Bulk insert logic for FANs
        const entries = Object.entries(votes);
        if (entries.length === 0) {
          return res.status(400).json({ error: 'No votes provided' });
        }

        let totalCost = 0;
        for (const [, v] of entries) {
          totalCost += calculateVoteCost(v);
        }

        if (totalCost > 150) {
          return res.status(400).json({ error: 'Budget exceeded' });
        }

        const fanProfile = await prisma.fanProfile.findUnique({
          where: { userId },
        });

        if (!fanProfile) {
          return res.status(404).json({ error: 'Fan profile not found' });
        }

        if (fanProfile.remainingCredits < totalCost) {
          return res.status(400).json({ error: 'Insufficient credits' });
        }

        const result = await prisma.$transaction(async (tx) => {
          // Decrease remaining credits for the whole bulk operation
          const updatedFan = await tx.fanProfile.update({
            where: { id: fanProfile.id },
            data: {
              remainingCredits: {
                decrement: totalCost,
              },
            },
          });

          if (updatedFan.remainingCredits < 0) {
            throw new Error('Insufficient credits during transaction');
          }

          const createdVotes = [];
          for (const [rId, v] of entries) {
            const cost = calculateVoteCost(v);

            // We assume a fresh state for the week based on UI, but upsert for safety
            const existingVote = await tx.vote.findUnique({
              where: {
                fanId_releaseId: {
                  fanId: fanProfile.id,
                  releaseId: rId,
                },
              },
            });

            if (existingVote) {
               const updatedVote = await tx.vote.update({
                  where: {
                    fanId_releaseId: { fanId: fanProfile.id, releaseId: rId },
                  },
                  data: {
                    allocatedVotes: { increment: v },
                    cost: { increment: cost },
                    votes: { increment: v },
                    credits: { increment: cost },
                  },
               });
               createdVotes.push(updatedVote);
            } else {
               const createdVote = await tx.vote.create({
                  data: {
                    fanId: fanProfile.id,
                    releaseId: rId,
                    allocatedVotes: v,
                    cost: cost,
                    votes: v,
                    credits: cost,
                  },
               });
               createdVotes.push(createdVote);
            }
          }

          return { createdVotes, remainingCredits: updatedFan.remainingCredits };
        });

        return res.status(200).json({
          success: true,
          votes: result.createdVotes,
          remainingCredits: result.remainingCredits,
        });

      } else {
         // Single vote fallback (not standard in new UI, but keeping for backward compatibility)
         return res.status(400).json({ error: 'Single FAN vote is deprecated. Use bulk type.' });
      }
    } else if (role === 'DJ') {
      if (!releaseId) {
         return res.status(400).json({ error: 'releaseId is required for DJ role' });
      }

      const release = await prisma.release.findUnique({
        where: { id: releaseId },
      });

      if (!release) {
        return res.status(404).json({ error: 'Release not found' });
      }

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
