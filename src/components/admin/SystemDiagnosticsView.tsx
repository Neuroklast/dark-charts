import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EnvCheck {
  ok: boolean;
  message: string;
}

interface AuditLogRow {
  id: string;
  action: string;
  adminEmail?: string | null;
  createdAt: string;
}

interface SystemDiagnosticsViewProps {
  diagnostics?: {
    tableCounts: Record<string, number>;
    isVotingPaused: boolean;
    maintenanceMode: boolean;
    envChecks: Record<string, EnvCheck>;
    recentAuditLogs: AuditLogRow[];
    timestamp: string;
    nodeEnv: string;
  };
  isLoading?: boolean;
  onSyncArtwork?: () => void;
  onRecalculate?: () => void;
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <Badge variant={ok ? 'default' : 'destructive'}>{ok ? 'OK' : 'Issue'}</Badge>
  );
}

export function SystemDiagnosticsView({
  diagnostics,
  isLoading,
  onSyncArtwork,
  onRecalculate,
}: SystemDiagnosticsViewProps) {
  if (isLoading || !diagnostics) {
    return (
      <div className="space-y-4" data-testid="system-loading">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const counts = diagnostics.tableCounts;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant={diagnostics.isVotingPaused ? 'destructive' : 'default'}>
          Voting {diagnostics.isVotingPaused ? 'paused' : 'active'}
        </Badge>
        <Badge variant={diagnostics.maintenanceMode ? 'destructive' : 'outline'}>
          Maintenance {diagnostics.maintenanceMode ? 'on' : 'off'}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {diagnostics.nodeEnv} · {new Date(diagnostics.timestamp).toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(counts).map(([key, value]) => (
          <Card key={key} className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{key}</p>
            <p className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3">Environment checks</h2>
        <div className="space-y-2">
          {Object.entries(diagnostics.envChecks).map(([key, check]) => (
            <div key={key} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-mono">{key}</p>
                <p className="text-xs text-muted-foreground">{check.message}</p>
              </div>
              <StatusBadge ok={check.ok} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3">Maintenance actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={onSyncArtwork}>
            Run artwork sync
          </Button>
          <Button size="sm" variant="secondary" onClick={onRecalculate}>
            Recalculate current week
          </Button>
        </div>
      </Card>

      {diagnostics.recentAuditLogs.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold mb-3">Recent admin actions</h2>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {diagnostics.recentAuditLogs.map((log) => (
              <div key={log.id} className="flex gap-3 text-xs py-1 border-b border-border last:border-0">
                <span className="text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
                <span className="text-muted-foreground">{log.adminEmail}</span>
                <span className="font-medium uppercase">{log.action}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}