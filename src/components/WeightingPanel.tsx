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
    <Card className="bg-card border border-border p-5 sticky top-24">
      <div className="flex items-center gap-3 mb-6 pb-3 border-b border-accent">
        <Sliders weight="bold" className="w-6 h-6 text-accent" />
        <h3 className="font-ui text-lg font-bold uppercase tracking-[0.1em] text-foreground">
          Weight Control
        </h3>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-card-foreground">
              Fan Charts
            </label>
            <span className="data-font text-lg font-bold text-accent tabular-nums px-2 py-0.5 bg-background border border-accent">
              {weights.fan}%
            </span>
          </div>
          <Slider
            value={[weights.fan]}
            onValueChange={handleFanChange}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-card-foreground">
              Expert Charts
            </label>
            <span className="data-font text-lg font-bold text-accent tabular-nums px-2 py-0.5 bg-background border border-accent">
              {weights.expert}%
            </span>
          </div>
          <Slider
            value={[weights.expert]}
            onValueChange={handleExpertChange}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-card-foreground">
              Streaming Charts
            </label>
            <span className="data-font text-lg font-bold text-accent tabular-nums px-2 py-0.5 bg-background border border-accent">
              {weights.streaming}%
            </span>
          </div>
          <Slider
            value={[weights.streaming]}
            onValueChange={handleStreamingChange}
            max={100}
            step={1}
          />
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-ui text-xs font-bold uppercase tracking-[0.2em] text-card-foreground">
              Total
            </span>
            <span className={`data-font text-xl font-bold tabular-nums px-2 py-1 border ${total > 100 ? 'text-primary border-primary' : 'text-accent border-accent'}`}>
              {total}%
            </span>
          </div>
          {total > 100 && (
            <p className="text-[10px] text-primary mt-2 font-ui uppercase tracking-[0.15em] text-center">
              ⚠ Auto-normalized to 100%
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
