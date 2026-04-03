import { ChartType } from '@/types';
import { cn } from '@/lib/utils';

interface PillarNavigationProps {
  activePillar: ChartType;
  onPillarChange: (pillar: ChartType) => void;
  className?: string;
}

export function PillarNavigation({ activePillar, onPillarChange, className }: PillarNavigationProps) {
  const pillars: { value: ChartType; label: string }[] = [
    { value: 'fan', label: 'Fan' },
    { value: 'expert', label: 'Expert' },
    { value: 'streaming', label: 'Stream' },
  ];

  return (
    <div className={cn("flex items-center justify-center gap-2 px-4", className)}>
      <div className="inline-flex bg-card border border-border">
        {pillars.map((pillar) => (
          <button
            key={pillar.value}
            onClick={() => onPillarChange(pillar.value)}
            className={cn(
              "px-8 py-3 font-ui text-xs uppercase tracking-[0.2em] font-bold snap-transition border-r last:border-r-0 border-border",
              activePillar === pillar.value
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-primary/20 hover:text-foreground"
            )}
          >
            {pillar.label}
          </button>
        ))}
      </div>
    </div>
  );
}
