import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ThemeConfig } from '@/config/themeConfig';

const COLOR_FIELDS: Array<{ key: keyof NonNullable<ThemeConfig['colors']>; label: string }> = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'background', label: 'Background' },
  { key: 'foreground', label: 'Foreground' },
  { key: 'card', label: 'Card' },
  { key: 'muted', label: 'Muted' },
  { key: 'accent', label: 'Accent' },
  { key: 'border', label: 'Border' },
];

interface ThemeEditorViewProps {
  colors?: NonNullable<ThemeConfig['colors']>;
  isLoading?: boolean;
  isSaving?: boolean;
  onColorChange?: (key: string, value: string) => void;
  onSave?: () => void;
  onReset?: () => void;
}

export function ThemeEditorView({
  colors,
  isLoading,
  isSaving,
  onColorChange,
  onSave,
  onReset,
}: ThemeEditorViewProps) {
  if (isLoading || !colors) {
    return (
      <div className="space-y-4" data-testid="colors-loading">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Color tokens</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onReset}>
              Reset defaults
            </Button>
            <Button size="sm" onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save theme'}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COLOR_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`color-${key}`}>{label}</Label>
              <div className="flex gap-2">
                <Input
                  id={`color-${key}`}
                  value={colors[key] ?? ''}
                  onChange={(e) => onColorChange?.(key, e.target.value)}
                  className="font-mono text-xs"
                />
                <input
                  type="color"
                  value={colors[key] ?? '#000000'}
                  onChange={(e) => onColorChange?.(key, e.target.value)}
                  className="h-9 w-10 rounded border border-border cursor-pointer"
                  aria-label={`${label} picker`}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        className="p-6 min-h-[280px] border-border"
        style={{
          backgroundColor: colors.background,
          color: colors.foreground,
          borderColor: colors.border,
        }}
      >
        <p className="text-xs uppercase tracking-widest opacity-60 mb-4">Live preview</p>
        <div
          className="rounded-lg p-4 mb-4"
          style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
        >
          <p className="font-semibold mb-1" style={{ color: colors.primary }}>
            Dark Charts
          </p>
          <p className="text-sm opacity-80">Chart card preview with themed colors.</p>
        </div>
        <div className="flex gap-2">
          <span
            className="px-3 py-1.5 rounded text-sm font-medium"
            style={{ backgroundColor: colors.primary, color: colors.foreground }}
          >
            Primary
          </span>
          <span
            className="px-3 py-1.5 rounded text-sm font-medium"
            style={{ backgroundColor: colors.secondary, color: colors.foreground }}
          >
            Secondary
          </span>
        </div>
      </Card>
    </div>
  );
}