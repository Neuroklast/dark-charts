import React from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface ChartControlViewProps {
  charts?: any[];
  isVotingPaused?: boolean;
  isLoading?: boolean;
  onTogglePause?: () => void;
  onRecalculate?: (weekStart: string) => void;
}

export function ChartControlView({ charts, isVotingPaused, isLoading, onTogglePause, onRecalculate }: ChartControlViewProps) {
  if (isLoading) {
    return (
      <div data-testid="chart-control-loading" className="space-y-6">
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-10 w-24" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-red-900/50 bg-red-950/10">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h2 className="text-xl font-display uppercase text-red-500 mb-1 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse inline-block" />
              Emergency Protocol
            </h2>
            <p className="text-sm text-muted-foreground font-ui">
              Instantly pause all active voting in case of identified bot attacks or manipulation.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-background p-4 rounded-md border border-border">
            <Switch
              id="emergency-pause"
              checked={isVotingPaused}
              onCheckedChange={onTogglePause}
              className="data-[state=checked]:bg-red-500"
            />
            <Label htmlFor="emergency-pause" className="font-ui uppercase tracking-widest text-xs font-bold data-[state=checked]:text-red-500">
              {isVotingPaused ? 'Voting Paused' : 'Voting Active'}
            </Label>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-display uppercase tracking-widest mb-4">Historical Aggregation Archive</h3>
        <div className="space-y-4">
          {charts?.map(chart => (
            <div key={chart.id} className="flex items-center justify-between p-3 bg-secondary/50 border border-border">
              <div>
                <p className="font-bold text-sm">Week: {new Date(chart.weekStart).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground font-ui uppercase tracking-wider">
                  Type: {chart.chartType} | Entries: {chart._count?.entries || 'Unknown'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onRecalculate?.(chart.weekStart)}>
                Recalculate
              </Button>
            </div>
          ))}
          {(!charts || charts.length === 0) && (
            <p className="text-sm text-muted-foreground italic">No historical charts available.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
