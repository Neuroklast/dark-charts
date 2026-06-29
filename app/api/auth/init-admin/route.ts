import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import { authService } from '@/backend/services/AuthService';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const adminInitSecret = process.env.ADMIN_INIT_SECRET;
  if (!adminInitSecret) {
    logger.warn('init-admin called but ADMIN_INIT_SECRET is not set');
    throw new ApiError(503, 'Admin initialisation is not configured');
  }

  const providedSecret = req.headers.get('x-admin-init-secret');
  if (!providedSecret || providedSecret !== adminInitSecret) {
    logger.warn('init-admin called with invalid secret');
    throw new ApiError(403, 'Forbidden');
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new ApiError(400, 'ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set');
  }

  if (adminPassword.length < 12) {
    throw new ApiError(400, 'ADMIN_PASSWORD must be at least 12 characters');
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: existingAdmin } = await supabase
    .from('users')
    .select('email')
    .eq('role', 'ADMIN')
    .limit(1)
    .maybeSingle();

  if (existingAdmin) {
    throw new ApiError(409, 'An admin user already exists');
  }

  const result = await authService.registerAdmin(adminEmail, adminPassword);
  logger.info('Initial admin account created', { email: result.user.email });

  return NextResponse.json(
    {
      success: true,
      message: 'Admin user created successfully',
      email: result.user.email,
    },
    { status: 201 }
  );
});