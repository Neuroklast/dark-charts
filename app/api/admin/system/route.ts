import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/adminAuth';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getExtendedSettings } from '@/lib/admin/settingsExtensions';
import { ApiError } from '@/lib/errors';

export const GET = withAdminAuth(async () => {
  const supabase = createServiceRoleSupabaseClient();

  const [
    users,
    releases,
    votes,
    expertVotes,
    anomalies,
    chartEntries,
    auditLogs,
    settings,
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('releases').select('*', { count: 'exact', head: true }),
    supabase.from('votes').select('*', { count: 'exact', head: true }),
    supabase.from('expert_votes').select('*', { count: 'exact', head: true }),
    supabase
      .from('vote_anomalies')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false),
    supabase.from('chart_entries').select('*', { count: 'exact', head: true }),
    supabase
      .from('audit_logs')
      .select('*, admin:users(email)')
      .order('createdAt', { ascending: false })
      .limit(10),
    getExtendedSettings(supabase),
  ]);

  if (auditLogs.error) throw new ApiError(500, auditLogs.error.message);

  const envChecks = {
    database: { ok: true, message: 'Connected' },
    supabaseUrl: {
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      message: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing',
    },
    serviceRole: {
      ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      message: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Missing',
    },
    cron: {
      ok: Boolean(process.env.CRON_SECRET),
      message: process.env.CRON_SECRET ? 'Configured' : 'Not set',
    },
    r2: {
      ok: Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID),
      message:
        process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID
          ? 'Configured'
          : 'Not configured',
    },
  };

  return NextResponse.json({
    diagnostics: {
      tableCounts: {
        users: users.count ?? 0,
        releases: releases.count ?? 0,
        votes: votes.count ?? 0,
        expertVotes: expertVotes.count ?? 0,
        chartEntries: chartEntries.count ?? 0,
        openAnomalies: anomalies.count ?? 0,
      },
      isVotingPaused: settings.isVotingPaused,
      maintenanceMode: settings.featureFlags.maintenanceMode,
      envChecks,
      recentAuditLogs: (auditLogs.data ?? []).map((log) => ({
        id: log.id,
        action: log.action,
        adminEmail: log.admin?.email,
        createdAt: log.createdAt,
      })),
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV ?? 'unknown',
    },
  });
});