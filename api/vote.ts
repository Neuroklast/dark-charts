import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../src/backend/lib/prisma';
import { z } from 'zod';

const bodySchema = z.object({
  fanId: z.string().min(1, "fanId is required"),
  releaseId: z.string().min(1, "releaseId is required"),
  credits: z.number().int().min(1, "Credits must be at least 1"),
  votes: z.number().int().min(1, "Votes must be at least 1")
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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
    const parseResult = bodySchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid body parameters', details: parseResult.error.format() });
    }

    const { fanId, releaseId, credits, votes } = parseResult.data;

    const fan = await prisma.fanProfile.findUnique({
      where: { id: fanId },
    });

    if (!fan) {
      return res.status(404).json({ error: 'Fan profile not found' });
    }

    if (fan.credits < credits) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    const release = await prisma.release.findUnique({
      where: { id: releaseId },
    });

    if (!release) {
      return res.status(404).json({ error: 'Release not found' });
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        fanId_releaseId: {
          fanId,
          releaseId,
        },
      },
    });

    let updatedVote;
    let updatedFan;

    if (existingVote) {
      const additionalCredits = credits;
      const additionalVotes = votes;

      updatedVote = await prisma.vote.update({
        where: {
          fanId_releaseId: {
            fanId,
            releaseId,
          },
        },
        data: {
          credits: {
            increment: additionalCredits,
          },
          votes: {
            increment: additionalVotes,
          },
        },
      });

      updatedFan = await prisma.fanProfile.update({
        where: { id: fanId },
        data: {
          credits: {
            decrement: additionalCredits,
          },
        },
      });
    } else {
      updatedVote = await prisma.vote.create({
        data: {
          fanId,
          releaseId,
          credits,
          votes,
        },
      });

      updatedFan = await prisma.fanProfile.update({
        where: { id: fanId },
        data: {
          credits: {
            decrement: credits,
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      vote: updatedVote,
      remainingCredits: updatedFan.credits,
    });
  } catch (error) {
    console.error('Error processing vote:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  } finally {
    await prisma.$disconnect();
  }
}
