'use client';

import React, { useEffect, useState } from 'react';
import { DashboardMetricsView } from './DashboardMetricsView';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';

export function DashboardMetricsContainer() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await authFetch('/api/admin/metrics');
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.metrics);
        } else {
          toast.error('Failed to load metrics');
        }
      } catch {
        toast.error('Network error loading metrics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  return <DashboardMetricsView metrics={metrics} isLoading={isLoading} />;
}