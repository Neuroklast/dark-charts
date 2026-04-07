import React, { useEffect, useState } from 'react';
import { DashboardMetricsView } from './DashboardMetricsView';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardMetricsContainer() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/admin/metrics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.metrics);
        } else {
          toast.error('Failed to load metrics');
        }
      } catch (error) {
        toast.error('Network error loading metrics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  return <DashboardMetricsView metrics={metrics} isLoading={isLoading} />;
}
