import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { FEATURE_FLAG_DEFINITIONS } from '@/config/featureFlags';
import { getExtendedSettings, updateFeatureFlags } from '@/lib/admin/settingsExtensions';
import { ApiError } from '@/lib/errors';

export const GET = withAdminAuth(async () => {
  const supabase = createServiceRoleSupabaseClient();
  const { featureFlags } = await getExtendedSettings(supabase);

  const flags = FEATURE_FLAG_DEFINITIONS.map((def) => ({
    ...def,
    value: featureFlags[def.key as keyof typeof featureFlags],
  }));

  return NextResponse.json({ flags });
});

export const POST = withAdminAuth(async (req, adminId) => {
  const body = await req.json();
  const { flags } = body ?? {};
  if (!flags || typeof flags !== 'object') {
    throw new ApiError(400, 'flags object is required');
  }

  const supabase = createServiceRoleSupabaseClient();
  const allowedKeys = new Set(FEATURE_FLAG_DEFINITIONS.map((f) => f.key));
  const updates: Record<string, boolean> = {};

  for (const [key, value] of Object.entries(flags)) {
    if (!allowedKeys.has(key) || typeof value !== 'boolean') continue;
    updates[key] = value;
  }

  const next = await updateFeatureFlags(supabase, updates);

  await supabase.from('audit_logs').insert({
    adminId,
    action: 'UPDATE_FEATURE_FLAGS',
    details: updates,
  });

  return NextResponse.json({ success: true, flags: next });
});