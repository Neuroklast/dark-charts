import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, ApiError } from '@/lib/errors';
import { requireAuth } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const decoded = await requireAuth(req);
  const { userId } = decoded;

  const supabase = createServiceRoleSupabaseClient();

  const { data: fanProfile } = await supabase
    .from('fan_profiles')
    .select('id')
    .eq('userId', userId)
    .maybeSingle();

  if (fanProfile?.id) {
    await supabase.from('votes').delete().eq('fanId', fanProfile.id);
    await supabase.from('fan_profiles').delete().eq('id', fanProfile.id);
  }

  const { data: djProfile } = await supabase
    .from('dj_profiles')
    .select('id')
    .eq('userId', userId)
    .maybeSingle();

  if (djProfile?.id) {
    await supabase.from('expert_votes').delete().eq('djId', djProfile.id);
    await supabase.from('dj_profiles').delete().eq('id', djProfile.id);
  }

  await supabase.from('band_profiles').delete().eq('userId', userId);
  await supabase.from('label_profiles').delete().eq('userId', userId);
  await supabase.from('user_badges').delete().eq('userId', userId);
  await supabase.from('bookings').delete().eq('userId', userId);

  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) {
    throw new ApiError(500, `Failed to delete account: ${error.message}`);
  }

  return NextResponse.json({ success: true, message: 'Account deleted' });
});