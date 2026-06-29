import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';

const DEFAULT_SETTINGS = {
  voiceCreditsBudget: 150,
  chartWeights: {
    fan: 0.5,
    expert: 0.35,
    streaming: 0.15,
  },
};

export const GET = withAdminAuth(async () => {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('system_settings')
    .select('voiceCreditsBudget, chartWeights')
    .limit(1)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);

  const settings = {
    voiceCreditsBudget: data?.voiceCreditsBudget ?? DEFAULT_SETTINGS.voiceCreditsBudget,
    chartWeights: {
      ...DEFAULT_SETTINGS.chartWeights,
      ...(typeof data?.chartWeights === 'object' && data?.chartWeights !== null
        ? (data.chartWeights as Record<string, number>)
        : {}),
    },
  };

  return NextResponse.json({ settings });
});

export const POST = withAdminAuth(async (req, adminId) => {
  const body = await req.json();
  const { voiceCreditsBudget, chartWeights } = body ?? {};
  const supabase = createServiceRoleSupabaseClient();

  const { data: existing } = await supabase
    .from('system_settings')
    .select('id, voiceCreditsBudget, chartWeights')
    .limit(1)
    .maybeSingle();

  const nextSettings = {
    voiceCreditsBudget:
      voiceCreditsBudget ?? existing?.voiceCreditsBudget ?? DEFAULT_SETTINGS.voiceCreditsBudget,
    chartWeights: {
      ...DEFAULT_SETTINGS.chartWeights,
      ...(typeof existing?.chartWeights === 'object' && existing?.chartWeights !== null
        ? (existing.chartWeights as Record<string, number>)
        : {}),
      ...(chartWeights ?? {}),
    },
    updatedAt: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase
      .from('system_settings')
      .update(nextSettings)
      .eq('id', existing.id);
    if (error) throw new ApiError(500, error.message);
  } else {
    const { error } = await supabase.from('system_settings').insert(nextSettings);
    if (error) throw new ApiError(500, error.message);
  }

  await supabase.from('audit_logs').insert({
    adminId,
    action: 'UPDATE_SYSTEM_SETTINGS',
    details: { voiceCreditsBudget, chartWeights },
  });

  return NextResponse.json({
    success: true,
    settings: {
      voiceCreditsBudget: nextSettings.voiceCreditsBudget,
      chartWeights: nextSettings.chartWeights,
    },
  });
});