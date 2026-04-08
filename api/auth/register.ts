import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authService } from '../../src/backend/services/AuthService';
import { handleCors } from '../_lib/cors';
import { applyRateLimit } from '../_lib/rate-limit';
import { logger } from '../../src/lib/logger';

const VALID_ROLES = ['FAN', 'DJ', 'BAND', 'LABEL'] as const;
type AllowedRole = typeof VALID_ROLES[number];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res, 'POST,OPTIONS')) return;
  if (!applyRateLimit(req, res, { windowMs: 60_000, maxRequests: 5 })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, role, profileData } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  // Block admin self-registration
  if (role === 'ADMIN') {
    return res.status(403).json({ error: 'Admin accounts cannot be self-registered' });
  }

  const userRole: AllowedRole = VALID_ROLES.includes(role) ? role : 'FAN';

  try {
    const result = await authService.register({
      email,
      password,
      role: userRole,
      profileData,
    });

    return res.status(201).json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error: any) {
    logger.error('Registration failed', { error: error.message });
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}
