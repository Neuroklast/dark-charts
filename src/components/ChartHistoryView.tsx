import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChartType, WeeklyMovement, ChartSnapshot } from '@/types';
import { chartHistoryService } from '@/services/chartHistoryService';
import { TrendUp, TrendDown, ArrowUp, ArrowDown, Dot, ArrowsClockwise } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ChartHistoryView() {
  const [activeChart, setActiveChart] = useState<ChartType>('fan');
  const [weeklyMovement, setWeeklyMovement] = useState<WeeklyMovement | null>(null);
  const [snapshots, setSnapshots] = useState<ChartSnapshot[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [activeChart]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const [movement, snapshotsData] = await Promise.all([
        chartHistoryService.getWeeklyMovement(activeChart),
        chartHistoryService.getSnapshots()
      ]);
      
      setWeeklyMovement(movement);
      setSnapshots(snapshotsData);
      if (snapshotsData.length > 0 && !selectedWeek) {
        setSelectedWeek(snapshotsData[0].week);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSnapshot = useMemo(() => {
    if (!selectedWeek) return null;
    return snapshots.find(s => s.week === selectedWeek);
  }, [snapshots, selectedWeek]);

  const currentTracks = useMemo(() => {
    if (!selectedSnapshot) return [];
    
    switch (activeChart) {
      case 'fan':
        return selectedSnapshot.fanCharts.slice(0, 10);
      case 'expert':
        return selectedSnapshot.expertCharts.slice(0, 10);
      case 'streaming':
        return selectedSnapshot.streamingCharts.slice(0, 10);
      default:
        return selectedSnapshot.fanCharts.slice(0, 10);
    }
  }, [selectedSnapshot, activeChart]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMovementIcon = (movement?: number) => {
    if (!movement) return <Dot className="text-muted-foreground" weight="bold" />;
    if (movement > 0) return <ArrowUp className="text-accent" weight="bold" />;
    return <ArrowDown className="text-destructive" weight="bold" />;
  };

  const getMovementColor = (movement?: number) => {
    if (!movement) return 'text-muted-foreground';
    if (movement > 0) return 'text-accent';
    return 'text-destructive';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="bg-card border-border p-12 text-center max-w-md">
          <ArrowsClockwise className="mx-auto mb-4 text-muted-foreground" size={64} />
          <h3 className="display-font text-2xl text-foreground mb-2 uppercase tracking-tight">No History Yet</h3>
          <p className="font-ui text-sm text-muted-foreground">
            Chart history will be available once the first weekly snapshot is published.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="display-font text-3xl md:text-4xl text-foreground uppercase tracking-tight mb-2">
            Chart History
          </h1>
          <p className="font-ui text-sm text-muted-foreground">
            Track how artists moved through the charts week by week
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <Tabs value={activeChart} onValueChange={(v) => setActiveChart(v as ChartType)} className="w-full md:w-auto">
            <TabsList className="grid w-full md:w-auto grid-cols-3 bg-secondary border border-border">
              <TabsTrigger value="fan" className="data-font text-xs uppercase">
                Fan Charts
              </TabsTrigger>
              <TabsTrigger value="expert" className="data-font text-xs uppercase">
                Expert Charts
              </TabsTrigger>
              <TabsTrigger value="streaming" className="data-font text-xs uppercase">
                Streaming
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Select
            value={selectedWeek?.toString()}
            onValueChange={(v) => setSelectedWeek(parseInt(v))}
          >
            <SelectTrigger className="w-full md:w-[200px] bg-secondary border-border">
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
              {snapshots.map((snapshot) => (
                <SelectItem key={snapshot.week} value={snapshot.week.toString()}>
                  Week {snapshot.week} - {formatDate(snapshot.date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {weeklyMovement && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendUp className="text-accent" size={20} weight="bold" />
              <h3 className="font-ui text-xs uppercase tracking-wider text-muted-foreground">
                Top Risers
              </h3>
            </div>
            <div className="space-y-2">
              {weeklyMovement.movers.risers.slice(0, 3).map((track, idx) => (
                <div key={track.id} className="flex items-center gap-2">
                  <span className="data-font text-[10px] text-accent font-bold">
                    +{track.movement}
                  </span>
                  <span className="font-ui text-xs text-foreground truncate flex-1">
                    {track.artist}
                  </span>
                </div>
              ))}
              {weeklyMovement.movers.risers.length === 0 && (
                <p className="font-ui text-xs text-muted-foreground">No risers this week</p>
              )}
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendDown className="text-destructive" size={20} weight="bold" />
              <h3 className="font-ui text-xs uppercase tracking-wider text-muted-foreground">
                Top Fallers
              </h3>
            </div>
            <div className="space-y-2">
              {weeklyMovement.movers.fallers.slice(0, 3).map((track) => (
                <div key={track.id} className="flex items-center gap-2">
                  <span className="data-font text-[10px] text-destructive font-bold">
                    {track.movement}
                  </span>
                  <span className="font-ui text-xs text-foreground truncate flex-1">
                    {track.artist}
                  </span>
                </div>
              ))}
              {weeklyMovement.movers.fallers.length === 0 && (
                <p className="font-ui text-xs text-muted-foreground">No fallers this week</p>
              )}
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUp className="text-primary" size={20} weight="bold" />
              <h3 className="font-ui text-xs uppercase tracking-wider text-muted-foreground">
                New Entries
              </h3>
            </div>
            <div className="space-y-2">
              {weeklyMovement.movers.newEntries.slice(0, 3).map((track) => (
                <div key={track.id} className="flex items-center gap-2">
                  <span className="data-font text-[10px] text-primary font-bold">
                    #{track.rank}
                  </span>
                  <span className="font-ui text-xs text-foreground truncate flex-1">
                    {track.artist}
                  </span>
                </div>
              ))}
              {weeklyMovement.movers.newEntries.length === 0 && (
                <p className="font-ui text-xs text-muted-foreground">No new entries</p>
              )}
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowsClockwise className="text-primary" size={20} weight="bold" />
              <h3 className="font-ui text-xs uppercase tracking-wider text-muted-foreground">
                Re-Entries
              </h3>
            </div>
            <div className="space-y-2">
              {weeklyMovement.movers.reEntries.slice(0, 3).map((track) => (
                <div key={track.id} className="flex items-center gap-2">
                  <span className="data-font text-[10px] text-primary font-bold">
                    #{track.rank}
                  </span>
                  <span className="font-ui text-xs text-foreground truncate flex-1">
                    {track.artist}
                  </span>
                </div>
              ))}
              {weeklyMovement.movers.reEntries.length === 0 && (
                <p className="font-ui text-xs text-muted-foreground">No re-entries</p>
              )}
            </div>
          </Card>
        </div>
      )}

      <Card className="bg-card border-border">
        <div className="p-4 border-b border-border">
          <h2 className="display-font text-xl uppercase text-foreground tracking-tight">
            Week {selectedWeek} Rankings
          </h2>
          {selectedSnapshot && (
            <p className="font-ui text-xs text-muted-foreground mt-1">
              Published on {formatDate(selectedSnapshot.date)}
            </p>
          )}
        </div>

        <div>
          <AnimatePresence mode="popLayout">
            {currentTracks.map((track, index) => (
              <motion.div
                key={`${track.id}-${selectedWeek}`}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="flex items-center gap-3 min-w-[80px]">
                    <span className="data-font text-2xl font-bold text-primary tabular-nums">
                      {index + 1}
                    </span>
                    <div className="flex flex-col items-center">
                      {getMovementIcon(track.movement)}
                      {track.movement !== undefined && track.movement !== 0 && (
                        <span className={`data-font text-[10px] font-bold ${getMovementColor(track.movement)}`}>
                          {track.movement > 0 ? `+${track.movement}` : track.movement}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-ui text-sm font-semibold text-foreground truncate">
                      {track.artist}
                    </h3>
                    <p className="font-ui text-xs text-muted-foreground truncate">
                      {track.title}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
                    {track.genres.slice(0, 2).map((genre) => (
                      <span
                        key={genre}
                        className="data-font text-[9px] px-2 py-0.5 bg-secondary text-muted-foreground border border-border uppercase tracking-wider"
                      >
                        {genre}
                      </span>
                    ))}
                    {track.genres.length > 2 && (
                      <span className="data-font text-[9px] px-2 py-0.5 bg-secondary text-muted-foreground border border-border">
                        +{track.genres.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
