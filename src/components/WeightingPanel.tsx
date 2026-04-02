import { ChartWeights } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Sliders } from '@phosphor-icons/react';

interface WeightingPanelProps {
  weights: ChartWeights;
  onChange: (weights: ChartWeights) => void;
}

export function WeightingPanel({ weights, onChange }: WeightingPanelProps) {

  const handleFanChange = (value: number[]) => {
    onChange({ ...weights, fan: value[0] });
  };

  const handleExpertChange = (value: number[]) => {
    onChange({ ...weights, expert: value[0] });
  };

  const handleStreamingChange = (value: number[]) => {
    onChange({ ...weights, streaming: value[0] });
  };

  const total = weights.fan + weights.expert + weights.streaming;

  return (
    <Card className="bg-card border-4 border-border p-8 sticky top-24">
      <div className="flex items-center gap-4 mb-10 pb-6 border-b-2 border-accent">
        <Sliders weight="bold" className="w-8 h-8 text-accent" />
        <h3 className="font-ui text-2xl font-bold uppercase tracking-[0.15em] text-foreground">
          Weight Control
        </h3>
      </div>

      <div className="space-y-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-ui text-xs font-bold uppercase tracking-[0.2em] text-card-foreground">
              Fan Charts
            </label>
            <span className="data-font text-2xl font-bold text-accent tabular-nums px-3 py-1 bg-background border-2 border-accent">
              {weights.fan}%
            </span>
          </div>
          <Slider
            value={[weights.fan]}
            onValueChange={handleFanChange}
            max={100}
            step={1}
            className="cursor-crosshair"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-ui text-xs font-bold uppercase tracking-[0.2em] text-card-foreground">
              Expert Charts
            </label>
            <span className="data-font text-2xl font-bold text-accent tabular-nums px-3 py-1 bg-background border-2 border-accent">
              {weights.expert}%
            </span>
          </div>
          <Slider
            value={[weights.expert]}
            onValueChange={handleExpertChange}
            max={100}
            step={1}
            className="cursor-crosshair"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-ui text-xs font-bold uppercase tracking-[0.2em] text-card-foreground">
              Streaming Charts
            </label>
            <span className="data-font text-2xl font-bold text-accent tabular-nums px-3 py-1 bg-background border-2 border-accent">
              {weights.streaming}%
            </span>
          </div>
          <Slider
            value={[weights.streaming]}
            onValueChange={handleStreamingChange}
            max={100}
            step={1}
            className="cursor-crosshair"
          />
        </div>

        <div className="pt-8 border-t-4 border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="font-ui text-sm font-bold uppercase tracking-[0.3em] text-card-foreground">
              Total
            </span>
            <span className={`data-font text-3xl font-bold tabular-nums px-4 py-2 border-4 ${total > 100 ? 'text-primary border-primary' : 'text-toxic border-toxic'}`}>
              {total}%
            </span>
          </div>
          {total > 100 && (
            <p className="text-xs text-primary mt-3 font-ui uppercase tracking-[0.2em] text-center">
              ⚠ Auto-normalized to 100%
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
