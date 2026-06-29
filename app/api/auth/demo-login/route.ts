import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  applyCorsToResponse,
  applyRateLimit,
  handleCors,
  setRateLimitHeaders,
} from '@/lib/api-middleware';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable must be set');
  }
  return secret;
}

const DEMO_ACCOUNTS = [
  {
    role: 'FAN' as const,
    email: 'demo-fan@darkcharts.demo',
    profileData: { nickname: 'Demo Fan' },
  },
  {
    role: 'DJ' as const,
    email: 'demo-dj@darkcharts.demo',
    profileData: { bio: 'Demo DJ account for testing' },
  },
  {
    role: 'BAND' as const,
    email: 'demo-band@darkcharts.demo',
    profileData: {},
  },
  {
    role: 'LABEL' as const,
    email: 'demo-label@darkcharts.demo',
    profileData: { companyName: 'Demo Records' },
  },
] as const;

export const POST = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,OPTIONS');
  if (cors) return cors;

  const rateLimited = applyRateLimit(req, { windowMs: 60_000, maxRequests: 20 });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { role } = body ?? {};
  const demoConfig = DEMO_ACCOUNTS.find((a) => a.role === role);

  if (!demoConfig) {
    throw new ApiError(400, 'Invalid role. Must be one of: FAN, DJ, BAND, LABEL');
  }

  const supabase = createServiceRoleSupabaseClient();

  let { data: user } = await supabase
    .from('users')
    .select('*, fanProfile:fan_profiles(*), djProfile:dj_profiles(*), bandProfile:band_profiles(*), labelProfile:label_profiles(*)')
    .eq('email', demoConfig.email)
    .maybeSingle();

  if (!user) {
    const randomPassword = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: demoConfig.email,
        passwordHash,
        role: demoConfig.role,
      })
      .select()
      .single();

    if (createError || !createdUser) {
      throw new ApiError(500, 'Failed to create demo account');
    }

    if (demoConfig.role === 'FAN') {
      await supabase.from('fan_profiles').insert({
        userId: createdUser.id,
        nickname: demoConfig.profileData.nickname ?? 'Demo Fan',
        credits: 150,
        remainingCredits: 150,
      });
    } else if (demoConfig.role === 'DJ') {
      await supabase.from('dj_profiles').insert({
        userId: createdUser.id,
        bio: demoConfig.profileData.bio ?? 'Demo DJ',
        expertStatus: false,
        reputationScore: 0,
      });
    } else if (demoConfig.role === 'LABEL') {
      await supabase.from('label_profiles').insert({
        userId: createdUser.id,
        companyName: demoConfig.profileData.companyName ?? 'Demo Label',
      });
    }

    const refetch = await supabase
      .from('users')
      .select('*, fanProfile:fan_profiles(*), djProfile:dj_profiles(*), bandProfile:band_profiles(*), labelProfile:label_profiles(*)')
      .eq('email', demoConfig.email)
      .maybeSingle();

    user = refetch.data ?? undefined;
  }

  if (!user) {
    throw new ApiError(500, 'Failed to create demo account');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, isDemo: true },
    getJwtSecret(),
    { expiresIn: '2h' }
  );

  logger.info('Demo login', { role: demoConfig.role });

  const response = NextResponse.json({
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

  return setRateLimitHeaders(applyCorsToResponse(response, 'POST,OPTIONS'), req, {
    windowMs: 60_000,
    maxRequests: 20,
  });
});

export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  const cors = handleCors(req, 'POST,OPTIONS');
  return cors ?? NextResponse.json(null, { status: 200 });
});