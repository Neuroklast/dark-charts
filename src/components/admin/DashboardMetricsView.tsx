import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface DashboardMetricsViewProps {
  metrics?: any;
  isLoading?: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'ok' || status === 'configured'
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : status === 'not_configured'
      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${color}`}>
      {status}
    </span>
  );
}

export function DashboardMetricsView({ metrics, isLoading }: DashboardMetricsViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="metrics-loading">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <Skeleton className="h-10 w-16" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const apiHealth = metrics?.apiHealth ?? {};
  const auditLogs: any[] = metrics?.recentAuditLogs ?? [];

  return (
    <div className="space-y-8">
      {/* User counts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <h3 className="text-sm font-ui uppercase text-muted-foreground mb-2">Total Users</h3>
          <p className="text-3xl font-display">{metrics?.users?.total ?? 0}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-ui uppercase text-muted-foreground mb-2">Fans</h3>
          <p className="text-3xl font-display">{metrics?.users?.fans ?? 0}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-ui uppercase text-muted-foreground mb-2">DJs</h3>
          <p className="text-3xl font-display">{metrics?.users?.djs ?? 0}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-ui uppercase text-muted-foreground mb-2">Artists</h3>
          <p className="text-3xl font-display">{metrics?.artists ?? 0}</p>
        </Card>
      </div>

      {/* Voting this week */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="text-sm font-ui uppercase text-muted-foreground mb-2">Releases</h3>
          <p className="text-3xl font-display">{metrics?.releases ?? 0}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-ui uppercase text-muted-foreground mb-2">Fan Votes (Week)</h3>
          <p className="text-3xl font-display">{metrics?.voting?.fanVotesThisWeek ?? 0}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-ui uppercase text-muted-foreground mb-2">Expert Votes (Week)</h3>
          <p className="text-3xl font-display">{metrics?.voting?.expertVotesThisWeek ?? 0}</p>
        </Card>
      </div>

      {/* API Health */}
      {Object.keys(apiHealth).length > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-ui uppercase text-muted-foreground mb-4">API & Service Health</h3>
          <div className="space-y-3">
            {Object.entries(apiHealth).map(([key, info]: [string, any]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm font-mono uppercase tracking-wider">{key}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{info.message}</span>
                  <StatusBadge status={info.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent audit logs */}
      {auditLogs.length > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-ui uppercase text-muted-foreground mb-4">Recent Admin Actions</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0 text-xs">
                <span className="text-muted-foreground whitespace-nowrap font-mono">
                  {new Date(log.createdAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <span className="text-muted-foreground">{log.adminEmail}</span>
                <span className="font-medium uppercase tracking-wide">{log.action}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
