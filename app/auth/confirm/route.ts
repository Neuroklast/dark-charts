import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server-ssr';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  const origin = 'https://www.darkcharts.de';
  if (!tokenHash || tokenHash.length > 1000 || type !== 'recovery') {
    return NextResponse.redirect(new URL('/login?error=invalid_recovery', origin));
  }

  const response = NextResponse.redirect(new URL('/reset-password', origin));
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  const supabase = createRouteHandlerSupabaseClient(request, response);
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
  if (error) {
    return NextResponse.redirect(new URL('/login?error=expired_recovery', origin));
  }
  return response;
}
