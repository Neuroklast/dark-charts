import { NextRequest } from 'next/server';
import { authService } from '@/backend/services/AuthService';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import {
  createReadOnlyRouteSupabaseClient,
  createServerSupabaseClient,
} from '@/lib/supabase/server-ssr';

export interface ResolvedAuth {
  userId: string;
  email: string;
  role: string;
  isDemo?: boolean;
  source: 'supabase' | 'jwt';
}

async function loadUserRole(userId: string): Promise<{
  role: string;
  isSuspended: boolean;
} | null> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('role, isSuspended')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return { role: data.role, isSuspended: data.isSuspended };
}

export async function resolveAuthFromRequest(
  req: NextRequest
): Promise<ResolvedAuth | null> {
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  const supabase = createReadOnlyRouteSupabaseClient(req);
  const {
    data: { user },
    error,
  } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();

  if (!error && user) {
    const profile = await loadUserRole(user.id);
    if (!profile || profile.isSuspended) return null;
    return {
      userId: user.id,
      email: user.email ?? '',
      role: profile.role,
      source: 'supabase',
    };
  }

  if (bearerToken) {
    try {
      const { getServerEnv } = await import('@/lib/env.server');
      const { createClient } = await import('@supabase/supabase-js');
      const env = getServerEnv();
      const supabase = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(bearerToken);

      if (!error && user) {
        const profile = await loadUserRole(user.id);
        if (!profile || profile.isSuspended) return null;
        return {
          userId: user.id,
          email: user.email ?? '',
          role: profile.role,
          source: 'supabase',
        };
      }
    } catch {
      // Fall through to legacy JWT
    }
  }

  if (bearerToken) {
    const decoded = await authService.verifyToken(bearerToken);
    if (decoded) {
      const profile = await loadUserRole(decoded.userId);
      if (!profile || profile.isSuspended) return null;
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: profile.role,
        isDemo: decoded.isDemo,
        source: 'jwt',
      };
    }
  }

  return null;
}

export async function resolveAuthFromCookies(): Promise<ResolvedAuth | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const profile = await loadUserRole(user.id);
  if (!profile || profile.isSuspended) return null;

  return {
    userId: user.id,
    email: user.email ?? '',
    role: profile.role,
    source: 'supabase',
  };
}