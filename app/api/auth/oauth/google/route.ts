import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandler, ApiError } from '@/lib/errors';

const bodySchema = z
  .object({
    code: z.string().optional(),
    redirectUri: z.string().url(),
    grantType: z.enum(['authorization_code', 'refresh_token']).default('authorization_code'),
    refreshToken: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.grantType === 'authorization_code' && !data.code) {
      ctx.addIssue({ code: 'custom', message: 'code is required', path: ['code'] });
    }
    if (data.grantType === 'refresh_token' && !data.refreshToken) {
      ctx.addIssue({ code: 'custom', message: 'refreshToken is required', path: ['refreshToken'] });
    }
  });

export const POST = withErrorHandler(async (req: NextRequest) => {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new ApiError(503, 'Google OAuth is not configured on the server');
  }

  const body = bodySchema.parse(await req.json());

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
  });

  if (body.grantType === 'refresh_token') {
    if (!body.refreshToken) {
      throw new ApiError(400, 'refreshToken is required');
    }
    params.set('grant_type', 'refresh_token');
    params.set('refresh_token', body.refreshToken);
  } else {
    params.set('grant_type', 'authorization_code');
    params.set('code', body.code!);
    params.set('redirect_uri', body.redirectUri);
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      400,
      data.error_description ?? data.error ?? 'Google token exchange failed'
    );
  }

  return NextResponse.json({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    scope: data.scope,
  });
});