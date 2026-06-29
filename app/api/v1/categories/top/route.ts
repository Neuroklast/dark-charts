import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getTopCategories } from '@/lib/api/catalog';
import { createV1GetHandler, v1OptionsHandler } from '@/lib/api/v1-handler';

const querySchema = z.object({
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().min(1).max(50)),
});

export const GET = createV1GetHandler(async (req: NextRequest) => {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid parameters', 'VALIDATION_ERROR');
  }

  const supabase = createServiceRoleSupabaseClient();
  return getTopCategories(supabase, parsed.data.limit);
});

export const OPTIONS = v1OptionsHandler;