import React, { useEffect, useState } from 'react';
import { ChartControlView } from './ChartControlView';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function ChartControlContainer() {
  const [charts, setCharts] = useState<any[]>([]);
  const [isVotingPaused, setIsVotingPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/admin/charts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCharts(data.charts);
          setIsVotingPaused(data.isVotingPaused);
        } else {
          toast.error('Failed to load charts');
        }
      } catch (error) {
        toast.error('Network error loading charts');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCharts();
  }, []);

  const handleTogglePause = async () => {
    const prev = isVotingPaused;
    setIsVotingPaused(!isVotingPaused);

    try {
      const token = await getToken();
      const res = await fetch('/api/admin/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'toggle_pause' })
      });
      if (!res.ok) throw new Error();
      toast.success(isVotingPaused ? 'Voting active' : 'Voting paused');
    } catch {
      toast.error('Failed to toggle voting state');
      setIsVotingPaused(prev);
    }
  };

  const handleRecalculate = async (weekStart: string) => {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'recalculate_week', weekStart })
      });
      if (res.ok) {
        toast.success(`Recalculation started for week: ${new Date(weekStart).toLocaleDateString()}`);
      } else {
        toast.error('Failed to start recalculation');
      }
    } catch {
      toast.error('Network error during recalculation');
    }
  };

  return (
    <ChartControlView
      charts={charts}
      isVotingPaused={isVotingPaused}
      isLoading={isLoading}
      onTogglePause={handleTogglePause}
      onRecalculate={handleRecalculate}
    />
  );
}
