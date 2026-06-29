import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import {
  getSpotifyClientCredentialsToken,
  isSpotifyConfigured,
} from '@/lib/spotify-server';

export const GET = withErrorHandler(async (_req: NextRequest) => {
  if (!isSpotifyConfigured()) {
    throw new ApiError(503, 'Spotify credentials are not configured', 'SPOTIFY_NOT_CONFIGURED');
  }

  const token = await getSpotifyClientCredentialsToken();
  return NextResponse.json({
    success: true,
    access_token: token.access_token,
    expires_in: token.expires_in,
  });
});