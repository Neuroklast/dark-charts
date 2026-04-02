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
import logo from '@/assets/images/Gemini_Generated_Image_fa3defa3defa3def.png';

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
    <div className="min-h-screen bg-background relative overflow-x-hidden vignette">
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[100] opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="5" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)"/>
      </svg>

      <div 
        className="fixed inset-0 pointer-events-none z-[99]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.015) 2px,
            rgba(255, 255, 255, 0.015) 4px
          )`,
          animation: 'terminal-flicker 4s infinite'
        }}
      />

      <div className="relative z-10">
        <header className="border-b-2 border-primary bg-background sticky top-0 z-50">
          <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-8 md:py-10">
            <div className="flex flex-col items-center justify-center gap-6">
              <img 
                src={logo} 
                alt="Dark Charts" 
                className="w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56 object-contain chromatic-hover"
              />
              <p className="font-ui text-xs md:text-sm text-muted-foreground tracking-[0.3em] uppercase font-medium">
                Metal • Gothic • Alternative • Dark Electro
              </p>
            </div>
          </div>
        </header>

        <main className="max-w-[1800px] mx-auto px-4 md:px-8 py-12">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ChartType)} className="space-y-8">
            <TabsList className="w-full md:w-auto grid grid-cols-2 md:flex md:gap-0 bg-card border-2 border-border p-0 h-auto">
              <TabsTrigger 
                value="fan" 
                className="data-font uppercase tracking-[0.2em] font-bold text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground instant-transition px-8 py-4 border-r border-border hover:bg-primary hover:text-primary-foreground hover:glow-primary"
              >
                Fan Charts
              </TabsTrigger>
              <TabsTrigger 
                value="expert"
                className="data-font uppercase tracking-[0.2em] font-bold text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground instant-transition px-8 py-4 border-r border-border hover:bg-primary hover:text-primary-foreground hover:glow-primary"
              >
                Expert Charts
              </TabsTrigger>
              <TabsTrigger 
                value="streaming"
                className="data-font uppercase tracking-[0.2em] font-bold text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground instant-transition px-8 py-4 border-r border-border hover:bg-primary hover:text-primary-foreground hover:glow-primary"
              >
                Streaming
              </TabsTrigger>
              <TabsTrigger 
                value="overall"
                className="data-font uppercase tracking-[0.2em] font-bold text-xs md:text-sm data-[state=active]:bg-violet data-[state=active]:text-violet-foreground instant-transition px-8 py-4 hover:bg-violet hover:text-violet-foreground hover:glow-violet"
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
                <Card className="bg-card border-2 border-border">
                  <div className="p-5 border-b-2 border-border">
                    <h2 className="display-font text-2xl uppercase text-foreground tracking-tight font-bold">Full Fan Charts</h2>
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
                <Card className="bg-card border-2 border-border">
                  <div className="p-5 border-b-2 border-border">
                    <h2 className="display-font text-2xl uppercase text-foreground tracking-tight font-bold">Full Expert Charts</h2>
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
                <Card className="bg-card border-2 border-border">
                  <div className="p-5 border-b-2 border-border">
                    <h2 className="display-font text-2xl uppercase text-foreground tracking-tight font-bold">Full Streaming Charts</h2>
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
                    <Card className="bg-card border-2 border-border">
                      <div className="p-5 border-b-2 border-border">
                        <h2 className="display-font text-2xl uppercase text-foreground tracking-tight font-bold">Custom Overall Chart</h2>
                      </div>
                      <div>
                        {overallChart.slice(0, 10).map((track, index) => (
                          <ChartEntry key={track.id} track={track} index={index} />
                        ))}
                      </div>
                    </Card>
                  ) : (
                    <Card className="bg-card border-2 border-border p-16 text-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, var(--border) 10px, var(--border) 20px)`
                        }} />
                      </div>
                      <div className="relative">
                        <Skull weight="duotone" className="w-24 h-24 mx-auto text-muted-foreground mb-6 opacity-50" />
                        <h3 className="display-font text-4xl md:text-5xl uppercase text-muted-foreground mb-4 tracking-tight font-bold">
                          No Data Yet
                        </h3>
                        <p className="font-ui text-muted-foreground uppercase tracking-[0.2em] text-sm">
                          Adjust the weights to generate your chart
                        </p>
                      </div>
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

        <footer className="border-t-2 border-border py-10 px-4 md:px-8 mt-24 bg-secondary">
          <div className="max-w-[1800px] mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="display-font text-xl uppercase text-foreground mb-4 tracking-tight font-bold">Dark Charts</h3>
                <p className="font-ui text-sm text-muted-foreground leading-relaxed">
                  Independent music charts for Metal & Gothic scene. Fair, transparent, and free from pay-to-win mechanics.
                </p>
              </div>
              <div>
                <h4 className="font-ui text-xs font-bold uppercase tracking-[0.15em] text-accent mb-4">Principles</h4>
                <ul className="space-y-2 text-sm text-muted-foreground font-ui">
                  <li>• No pay-to-play</li>
                  <li>• Community-driven</li>
                  <li>• Transparent ranking</li>
                  <li>• Scene-focused</li>
                </ul>
              </div>
              <div>
                <h4 className="font-ui text-xs font-bold uppercase tracking-[0.15em] text-accent mb-4">About</h4>
                <p className="text-sm text-muted-foreground font-ui leading-relaxed">
                  Built for fans, by fans. Supporting underground artists through fair representation and authentic community engagement.
                </p>
              </div>
            </div>
            <div className="border-t border-border pt-6 text-center">
              <p className="font-ui text-xs text-muted-foreground uppercase tracking-[0.3em]">
                Dark Charts &copy; {new Date().getFullYear()} — Underground Never Dies
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
