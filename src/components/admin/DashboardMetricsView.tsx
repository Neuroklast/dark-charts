import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardMetricsViewProps {
  metrics?: any;
  isLoading?: boolean;
}

export function DashboardMetricsView({ metrics, isLoading }: DashboardMetricsViewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="metrics-loading">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <Skeleton className="h-10 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-6">
        <h3 className="text-sm font-ui uppercase text-muted-foreground mb-2">Total Users</h3>
        <p className="text-3xl font-display">{metrics?.users?.total || 0}</p>
      </Card>
      <Card className="p-6">
        <h3 className="text-sm font-ui uppercase text-muted-foreground mb-2">Active Fans</h3>
        <p className="text-3xl font-display">{metrics?.users?.fans || 0}</p>
      </Card>
      <Card className="p-6">
        <h3 className="text-sm font-ui uppercase text-muted-foreground mb-2">Active DJs</h3>
        <p className="text-3xl font-display">{metrics?.users?.djs || 0}</p>
      </Card>
      <Card className="p-6">
        <h3 className="text-sm font-ui uppercase text-muted-foreground mb-2">Indexed Artists</h3>
        <p className="text-3xl font-display">{metrics?.artists || 0}</p>
      </Card>
    </div>
  );
}
