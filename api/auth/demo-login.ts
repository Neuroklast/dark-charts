import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../src/backend/lib/prisma';
import { handleCors } from '../_lib/cors';
import { applyRateLimit } from '../_lib/rate-limit';
import { logger } from '../../src/lib/logger';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set');
}
const JWT_SECRET = process.env.JWT_SECRET;

const DEMO_ACCOUNTS = [
  {
    role: 'FAN' as const,
    email: 'demo-fan@darkcharts.demo',
    label: 'Demo Fan',
    profileData: { nickname: 'Demo Fan' },
  },
  {
    role: 'DJ' as const,
    email: 'demo-dj@darkcharts.demo',
    label: 'Demo DJ',
    profileData: { bio: 'Demo DJ account for testing' },
  },
  {
    role: 'BAND' as const,
    email: 'demo-band@darkcharts.demo',
    label: 'Demo Band',
    profileData: {},
  },
  {
    role: 'LABEL' as const,
    email: 'demo-label@darkcharts.demo',
    label: 'Demo Label',
    profileData: { companyName: 'Demo Records' },
  },
] as const;

type DemoRole = typeof DEMO_ACCOUNTS[number]['role'];

/**
 * POST /api/auth/demo-login
 *
 * Logs in to a read-only demo account for the requested role.
 * Demo tokens carry isDemo:true; vote and write endpoints skip persistence for demo sessions.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res, 'POST,OPTIONS')) return;
  if (!applyRateLimit(req, res, { windowMs: 60_000, maxRequests: 20 })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { role } = req.body || {};
  const demoConfig = DEMO_ACCOUNTS.find(a => a.role === role);

  if (!demoConfig) {
    return res.status(400).json({
      error: 'Invalid role. Must be one of: FAN, DJ, BAND, LABEL',
    });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email: demoConfig.email },
      include: {
        fanProfile: true,
        djProfile: true,
        bandProfile: true,
        labelProfile: true,
      },
    });

    if (!user) {
      // Create the demo account on first use
      const passwordHash = await bcrypt.hash(`demo-${demoConfig.role.toLowerCase()}-darkcharts`, 10);
      user = await prisma.user.create({
        data: {
          email: demoConfig.email,
          passwordHash,
          role: demoConfig.role,
        },
        include: {
          fanProfile: true,
          djProfile: true,
          bandProfile: true,
          labelProfile: true,
        },
      });

      // Create role profile
      if (demoConfig.role === 'FAN') {
        await prisma.fanProfile.create({
          data: {
            userId: user.id,
            nickname: demoConfig.profileData.nickname ?? 'Demo Fan',
            credits: 150,
            remainingCredits: 150,
          },
        });
      } else if (demoConfig.role === 'DJ') {
        await prisma.dJProfile.create({
          data: {
            userId: user.id,
            bio: demoConfig.profileData.bio ?? 'Demo DJ',
            expertStatus: false,
            reputationScore: 0,
          },
        });
      } else if (demoConfig.role === 'LABEL') {
        await prisma.labelProfile.create({
          data: {
            userId: user.id,
            companyName: demoConfig.profileData.companyName ?? 'Demo Label',
          },
        });
      }
      // BAND profiles require an existing artistId – skip automatic creation for demo BAND accounts

      // Re-fetch with profiles included
      user = await prisma.user.findUnique({
        where: { email: demoConfig.email },
        include: {
          fanProfile: true,
          djProfile: true,
          bandProfile: true,
          labelProfile: true,
        },
      });
    }

    if (!user) {
      return res.status(500).json({ error: 'Failed to create demo account' });
    }

    // Issue a demo JWT (includes isDemo flag so write endpoints can skip persistence)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, isDemo: true },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    logger.info('Demo login', { role: demoConfig.role });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isDemo: true,
        fanProfile: user.fanProfile ?? null,
        djProfile: user.djProfile ?? null,
        bandProfile: user.bandProfile ?? null,
        labelProfile: user.labelProfile ?? null,
      },
    });
  } catch (error: any) {
    logger.error('Demo login failed', { error: error.message });
    return res.status(500).json({ error: 'Demo login failed' });
  } finally {
    await prisma.$disconnect();
  }
}
