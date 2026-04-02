import { ChartWeights } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Sliders } from '@phosphor-icons/react';
import { useEffect } from 'react';

interface WeightingPanelProps {
  weights: ChartWeights;
  onChange: (weights: ChartWeights) => void;
}

export function WeightingPanel({ weights, onChange }: WeightingPanelProps) {
  useEffect(() => {
    const total = weights.fan + weights.expert + weights.streaming;
    if (total > 100) {
      const scale = 100 / total;
      onChange({
        fan: Math.round(weights.fan * scale),
        expert: Math.round(weights.expert * scale),
        streaming: Math.round(weights.streaming * scale)
      });
    }
  }, [weights, onChange]);

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
    <Card className="bg-card border-border p-6">
      <div className="flex items-center gap-3 mb-8">
        <Sliders weight="bold" className="w-6 h-6 text-accent" />
        <h3 className="font-ui text-xl font-bold uppercase tracking-widest text-foreground">
          Custom Weighting
        </h3>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-ui text-sm font-medium uppercase tracking-wider text-card-foreground">
              Fan Charts
            </label>
            <span className="data-font text-lg font-bold text-accent tabular-nums">
              {weights.fan}%
            </span>
          </div>
          <Slider
            value={[weights.fan]}
            onValueChange={handleFanChange}
            max={100}
            step={1}
            className="cursor-pointer"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-ui text-sm font-medium uppercase tracking-wider text-card-foreground">
              Expert Charts
            </label>
            <span className="data-font text-lg font-bold text-accent tabular-nums">
              {weights.expert}%
            </span>
          </div>
          <Slider
            value={[weights.expert]}
            onValueChange={handleExpertChange}
            max={100}
            step={1}
            className="cursor-pointer"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-ui text-sm font-medium uppercase tracking-wider text-card-foreground">
              Streaming Charts
            </label>
            <span className="data-font text-lg font-bold text-accent tabular-nums">
              {weights.streaming}%
            </span>
          </div>
          <Slider
            value={[weights.streaming]}
            onValueChange={handleStreamingChange}
            max={100}
            step={1}
            className="cursor-pointer"
          />
        </div>

        <div className="pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="font-ui text-sm font-bold uppercase tracking-wider text-card-foreground">
              Total
            </span>
            <span className={`data-font text-2xl font-bold tabular-nums ${total > 100 ? 'text-primary' : 'text-accent'}`}>
              {total}%
            </span>
          </div>
          {total > 100 && (
            <p className="text-xs text-primary mt-2 font-ui uppercase tracking-wider">
              Values auto-normalized to 100%
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
