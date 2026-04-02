import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChartService } from '@/services/chartService';
import { Track, ChartWeights, ChartType } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartCategory } from '@/components/ChartCategory';
import { ChartEntry } from '@/components/ChartEntry';
import { WeightingPanel } from '@/components/WeightingPanel';
import { Card } from '@/components/ui/card';
import { Skull } from '@phosphor-icons/react';
import { useKV } from '@github/spark/hooks';

function App() {
  const [activeTab, setActiveTab] = useState<ChartType>('fan');
  const [fanCharts, setFanCharts] = useState<Track[]>([]);
  const [expertCharts, setExpertCharts] = useState<Track[]>([]);
  const [streamingCharts, setStreamingCharts] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [weights, setWeights] = useKV<ChartWeights>('chart-weights', {
    fan: 33,
    expert: 33,
    streaming: 34
  });

  useEffect(() => {
    const loadCharts = async () => {
      setIsLoading(true);
      try {
        const data = await ChartService.getAllCharts();
        setFanCharts(data.fanCharts);
        setExpertCharts(data.expertCharts);
        setStreamingCharts(data.streamingCharts);
      } catch (error) {
        console.error('Failed to load charts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharts();
  }, []);

  const overallChart = useMemo(() => {
    if (!fanCharts.length || !expertCharts.length || !streamingCharts.length || !weights) {
      return [];
    }
    return ChartService.calculateOverallChart(weights);
  }, [weights, fanCharts, expertCharts, streamingCharts]);

  const handleWeightsChange = useCallback((newWeights: ChartWeights) => {
    setWeights(newWeights);
  }, [setWeights]);

  return (
    <div className="min-h-screen bg-background">
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              oklch(0.18 0 0) 2px,
              oklch(0.18 0 0) 4px
            )
          `
        }}
      />

      <div className="relative">
        <header className="border-b-4 border-primary py-12 px-4 md:px-8">
          <div className="max-w-[1600px] mx-auto">
            <h1 className="display-font text-5xl md:text-7xl uppercase text-foreground tracking-tighter">
              Dark Charts
            </h1>
            <p className="font-ui text-lg md:text-xl text-card-foreground mt-4 tracking-wide uppercase font-medium">
              Underground Metal & Gothic Music Charts
            </p>
          </div>
        </header>

        <main className="max-w-[1600px] mx-auto px-4 md:px-8 py-12">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ChartType)} className="space-y-8">
            <TabsList className="w-full md:w-auto grid grid-cols-2 md:flex md:gap-2 bg-card border-2 border-border p-2">
              <TabsTrigger 
                value="fan" 
                className="data-font uppercase tracking-wider font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-150"
              >
                Fan Charts
              </TabsTrigger>
              <TabsTrigger 
                value="expert"
                className="data-font uppercase tracking-wider font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-150"
              >
                Expert Charts
              </TabsTrigger>
              <TabsTrigger 
                value="streaming"
                className="data-font uppercase tracking-wider font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-150"
              >
                Streaming Charts
              </TabsTrigger>
              <TabsTrigger 
                value="overall"
                className="data-font uppercase tracking-wider font-bold text-sm data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all duration-150"
              >
                Overall
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fan" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCategory title="Fan Charts Top 3" tracks={fanCharts} isLoading={isLoading} />
                <ChartCategory title="Expert Charts Top 3" tracks={expertCharts} isLoading={isLoading} />
                <ChartCategory title="Streaming Charts Top 3" tracks={streamingCharts} isLoading={isLoading} />
              </div>

              {!isLoading && fanCharts.length > 3 && (
                <Card className="bg-card border-border">
                  <div className="p-6 border-b border-border">
                    <h2 className="display-font text-2xl uppercase text-foreground tracking-tight">Full Fan Charts</h2>
                  </div>
                  <div>
                    {fanCharts.map((track, index) => (
                      <ChartEntry key={track.id} track={track} index={index} />
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="expert" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCategory title="Fan Charts Top 3" tracks={fanCharts} isLoading={isLoading} />
                <ChartCategory title="Expert Charts Top 3" tracks={expertCharts} isLoading={isLoading} />
                <ChartCategory title="Streaming Charts Top 3" tracks={streamingCharts} isLoading={isLoading} />
              </div>

              {!isLoading && expertCharts.length > 3 && (
                <Card className="bg-card border-border">
                  <div className="p-6 border-b border-border">
                    <h2 className="display-font text-2xl uppercase text-foreground tracking-tight">Full Expert Charts</h2>
                  </div>
                  <div>
                    {expertCharts.map((track, index) => (
                      <ChartEntry key={track.id} track={track} index={index} />
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="streaming" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCategory title="Fan Charts Top 3" tracks={fanCharts} isLoading={isLoading} />
                <ChartCategory title="Expert Charts Top 3" tracks={expertCharts} isLoading={isLoading} />
                <ChartCategory title="Streaming Charts Top 3" tracks={streamingCharts} isLoading={isLoading} />
              </div>

              {!isLoading && streamingCharts.length > 3 && (
                <Card className="bg-card border-border">
                  <div className="p-6 border-b border-border">
                    <h2 className="display-font text-2xl uppercase text-foreground tracking-tight">Full Streaming Charts</h2>
                  </div>
                  <div>
                    {streamingCharts.map((track, index) => (
                      <ChartEntry key={track.id} track={track} index={index} />
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="overall" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {overallChart.length > 0 ? (
                    <Card className="bg-card border-border">
                      <div className="p-6 border-b border-border">
                        <h2 className="display-font text-2xl uppercase text-foreground tracking-tight">Custom Overall Chart</h2>
                      </div>
                      <div>
                        {overallChart.slice(0, 10).map((track, index) => (
                          <ChartEntry key={track.id} track={track} index={index} />
                        ))}
                      </div>
                    </Card>
                  ) : (
                    <Card className="bg-card border-border p-12 text-center">
                      <Skull weight="duotone" className="w-24 h-24 mx-auto text-muted-foreground mb-6" />
                      <h3 className="display-font text-3xl uppercase text-muted-foreground mb-3">
                        No Souls Ranked Yet
                      </h3>
                      <p className="font-ui text-muted-foreground uppercase tracking-wider">
                        Adjust the weights to summon the chart
                      </p>
                    </Card>
                  )}
                </div>

                <div>
                  {weights && <WeightingPanel weights={weights} onChange={handleWeightsChange} />}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        <footer className="border-t border-border py-8 px-4 md:px-8 mt-20">
          <div className="max-w-[1600px] mx-auto text-center">
            <p className="font-ui text-sm text-muted-foreground uppercase tracking-widest">
              Dark Charts &copy; {new Date().getFullYear()} — Underground Never Dies
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
