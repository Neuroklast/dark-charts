import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getCurrentCharts } from '@/lib/api/catalog';
import { createV1GetHandler, v1OptionsHandler } from '@/lib/api/v1-handler';

const querySchema = z.object({
  type: z.enum(['fan', 'expert', 'streaming', 'combined', 'all']).optional().default('all'),
  limit: z
    .string()
    .optional()
    .default('50')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().min(1).max(100)),
  completed: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
});

export const GET = createV1GetHandler(async (req: NextRequest) => {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid parameters', 'VALIDATION_ERROR');
  }

  const supabase = createServiceRoleSupabaseClient();
  return getCurrentCharts(supabase, parsed.data);
});

export const OPTIONS = v1OptionsHandler;