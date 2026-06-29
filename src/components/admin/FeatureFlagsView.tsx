import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export interface FeatureFlagRow {
  key: string;
  label: string;
  description: string;
  value: boolean;
}

interface FeatureFlagsViewProps {
  flags?: FeatureFlagRow[];
  isLoading?: boolean;
  onToggle?: (key: string, value: boolean) => void;
}

export function FeatureFlagsView({ flags, isLoading, onToggle }: FeatureFlagsViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="features-loading">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flags?.map((flag) => (
        <Card key={flag.key} className="p-4 flex items-center justify-between gap-4">
          <div>
            <Label htmlFor={flag.key} className="text-sm font-semibold">
              {flag.label}
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
          </div>
          <Switch
            id={flag.key}
            checked={flag.value}
            onCheckedChange={(checked) => onToggle?.(flag.key, checked)}
          />
        </Card>
      ))}
    </div>
  );
}