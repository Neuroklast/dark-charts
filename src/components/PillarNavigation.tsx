import { ChartType } from '@/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface PillarNavigationProps {
  activePillar: ChartType | 'overview';
  onPillarChange: (pillar: ChartType | 'overview') => void;
  className?: string;
}

export function PillarNavigation({ activePillar, onPillarChange, className }: PillarNavigationProps) {
  const { t } = useLanguage();
  
  const pillars: { value: ChartType | 'overview'; label: string }[] = [
    { value: 'overview', label: t('pillar.overview') },
    { value: 'fan', label: t('pillar.fan') },
    { value: 'expert', label: t('pillar.expert') },
    { value: 'streaming', label: t('pillar.streaming') },
  ];

  return (
    <div className={cn("w-full bg-card/50 border-y border-border", className)}>
      <div className="w-full px-4 md:px-8 py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center gap-0">
            <div className="inline-flex border border-border w-full md:w-auto overflow-hidden">
              {pillars.map((pillar) => (
                <button
                  key={pillar.value}
                  onClick={() => onPillarChange(pillar.value)}
                  className={cn(
                    "flex-1 md:flex-none px-4 md:px-8 py-3 font-ui text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] font-bold snap-transition border-r last:border-r-0 border-border",
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
        </div>
      </div>
    </div>
  );
}
