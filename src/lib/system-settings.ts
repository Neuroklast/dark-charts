import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/errors';

type ServiceClient = SupabaseClient<any, 'public', any>;

export async function getIsVotingPaused(supabase: ServiceClient): Promise<boolean> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('isVotingPaused')
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, `Failed to read voting pause state: ${error.message}`);
  }

  return data?.isVotingPaused ?? false;
}

export interface ChartWeightSettings {
  fan: number;
  expert: number;
  streaming: number;
}

export async function getVoiceCreditsBudget(supabase: ServiceClient): Promise<number> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('voiceCreditsBudget')
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, `Failed to read voice credits budget: ${error.message}`);
  }

  return data?.voiceCreditsBudget ?? 150;
}

export async function getChartWeights(supabase: ServiceClient): Promise<ChartWeightSettings> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('chartWeights')
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, `Failed to read chart weights: ${error.message}`);
  }

  const weights = data?.chartWeights as ChartWeightSettings | null;
  return {
    fan: weights?.fan ?? 0.5,
    expert: weights?.expert ?? 0.35,
    streaming: weights?.streaming ?? 0.15,
  };
}

export async function setIsVotingPaused(
  supabase: ServiceClient,
  isVotingPaused: boolean
): Promise<void> {
  const { data: existing, error: readError } = await supabase
    .from('system_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (readError) {
    throw new ApiError(500, `Failed to update voting pause state: ${readError.message}`);
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('system_settings')
      .update({ isVotingPaused, updatedAt: new Date().toISOString() })
      .eq('id', existing.id);

    if (error) {
      throw new ApiError(500, `Failed to update voting pause state: ${error.message}`);
    }
    return;
  }

  const { error } = await supabase.from('system_settings').insert({
    isVotingPaused,
    voiceCreditsBudget: 150,
    chartWeights: { fan: 0.5, expert: 0.35, streaming: 0.15 },
  });

  if (error) {
    throw new ApiError(500, `Failed to create voting pause state: ${error.message}`);
  }
}