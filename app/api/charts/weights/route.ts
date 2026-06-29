import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { DEFAULT_CHART_WEIGHTS, getSystemSettings } from '@/lib/api/systemSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const settings = await getSystemSettings(supabase);
    return NextResponse.json({
      weights: {
        fan: settings.chartWeights.fan,
        expert: settings.chartWeights.expert,
        streaming: 0,
      },
    });
  } catch {
    return NextResponse.json({ weights: DEFAULT_CHART_WEIGHTS });
  }
}