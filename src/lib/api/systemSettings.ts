import type { AppSupabaseClient } from '@/types/supabase-client'
import type { Database, Json } from '@/types/database'
import type { ChartWeights } from '@/types'

export const GLOBAL_SETTINGS_ID = 'global'

export const DEFAULT_CHART_WEIGHTS: ChartWeights = {
  fan: 0.55,
  expert: 0.45,
  streaming: 0,
}

export interface SystemSettings {
  id: string
  isVotingPaused: boolean
  voiceCreditsBudget: number
  chartWeights: ChartWeights
  createdAt: string
  updatedAt: string
}

type SystemSettingsRow = Database['public']['Tables']['system_settings']['Row']

function parseChartWeights(value: Json | null | undefined): ChartWeights {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_CHART_WEIGHTS
  }

  const weights = value as Record<string, unknown>

  return {
    fan: typeof weights.fan === 'number' ? weights.fan : DEFAULT_CHART_WEIGHTS.fan,
    expert:
      typeof weights.expert === 'number'
        ? weights.expert
        : DEFAULT_CHART_WEIGHTS.expert,
    streaming:
      typeof weights.streaming === 'number'
        ? weights.streaming
        : DEFAULT_CHART_WEIGHTS.streaming,
  }
}

function toSystemSettings(row: SystemSettingsRow): SystemSettings {
  return {
    id: row.id,
    isVotingPaused: row.isVotingPaused,
    voiceCreditsBudget: row.voiceCreditsBudget,
    chartWeights: parseChartWeights(row.chartWeights),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function getSystemSettings(
  supabase: AppSupabaseClient
): Promise<SystemSettings> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', GLOBAL_SETTINGS_ID)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch system settings: ${error.message}`)
  }

  if (!data) {
    const { data: created, error: createError } = await supabase
      .from('system_settings')
      .insert({
        id: GLOBAL_SETTINGS_ID,
        isVotingPaused: false,
        voiceCreditsBudget: 150,
        chartWeights: DEFAULT_CHART_WEIGHTS,
      })
      .select('*')
      .single()

    if (createError || !created) {
      throw new Error(
        createError?.message ?? 'Failed to initialize system settings'
      )
    }

    return toSystemSettings(created)
  }

  return toSystemSettings(data)
}

export interface UpdateSystemSettingsInput {
  isVotingPaused?: boolean
  voiceCreditsBudget?: number
  chartWeights?: Partial<ChartWeights>
}

export async function updateSystemSettings(
  supabase: AppSupabaseClient,
  input: UpdateSystemSettingsInput
): Promise<SystemSettings> {
  const current = await getSystemSettings(supabase)

  const nextChartWeights = input.chartWeights
    ? { ...current.chartWeights, ...input.chartWeights }
    : current.chartWeights

  const { data, error } = await supabase
    .from('system_settings')
    .update({
      isVotingPaused: input.isVotingPaused ?? current.isVotingPaused,
      voiceCreditsBudget:
        input.voiceCreditsBudget ?? current.voiceCreditsBudget,
      chartWeights: nextChartWeights,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', GLOBAL_SETTINGS_ID)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to update system settings')
  }

  return toSystemSettings(data)
}