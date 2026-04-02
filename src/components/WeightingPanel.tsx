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
    <Card className="bg-card border-2 border-border p-6 sticky top-24">
      <div className="flex items-center gap-4 mb-8 pb-4 border-b-2 border-violet">
        <Sliders weight="bold" className="w-7 h-7 text-violet" />
        <h3 className="font-ui text-xl font-bold uppercase tracking-[0.1em] text-foreground">
          Weight Control
        </h3>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-ui text-xs font-bold uppercase tracking-[0.15em] text-card-foreground">
              Fan Charts
            </label>
            <span className="data-font text-xl font-bold text-violet tabular-nums px-2 py-1 bg-background border border-violet">
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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-ui text-xs font-bold uppercase tracking-[0.15em] text-card-foreground">
              Expert Charts
            </label>
            <span className="data-font text-xl font-bold text-violet tabular-nums px-2 py-1 bg-background border border-violet">
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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-ui text-xs font-bold uppercase tracking-[0.15em] text-card-foreground">
              Streaming Charts
            </label>
            <span className="data-font text-xl font-bold text-violet tabular-nums px-2 py-1 bg-background border border-violet">
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

        <div className="pt-6 border-t-2 border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-ui text-sm font-bold uppercase tracking-[0.2em] text-card-foreground">
              Total
            </span>
            <span className={`data-font text-2xl font-bold tabular-nums px-3 py-2 border-2 ${total > 100 ? 'text-primary border-primary' : 'text-toxic border-toxic'}`}>
              {total}%
            </span>
          </div>
          {total > 100 && (
            <p className="text-xs text-primary mt-2 font-ui uppercase tracking-[0.15em] text-center">
              ⚠ Auto-normalized to 100%
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
