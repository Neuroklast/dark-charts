import { Button } from '@/components/ui/button';
import { chartHistoryService } from '@/services/chartHistoryService';
import { toast } from 'sonner';
import { ArrowsClockwise } from '@phosphor-icons/react';
import { Track } from '@/types';

interface ChartHistorySeedProps {
  fanCharts: Track[];
  expertCharts: Track[];
  streamingCharts: Track[];
}

export function ChartHistorySeed({ fanCharts, expertCharts, streamingCharts }: ChartHistorySeedProps) {
  const handleSeedHistory = async () => {
    try {
      await chartHistoryService.saveSnapshot(fanCharts, expertCharts, streamingCharts);
      toast.success('Chart snapshot saved successfully!', {
        description: 'Historical data updated for this week'
      });
    } catch (error) {
      console.error('Failed to save snapshot:', error);
      toast.error('Failed to save chart snapshot');
    }
  };

  return (
    <Button
      onClick={handleSeedHistory}
      variant="outline"
      size="sm"
      className="gap-2 data-font"
    >
      <ArrowsClockwise weight="bold" />
      Save Weekly Snapshot
    </Button>
  );
}
