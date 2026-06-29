import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export interface ApiKeyStatus {
  key: string;
  label: string;
  configured: boolean;
  hint: string | null;
  required: boolean;
}

interface ApiKeysViewProps {
  keys?: ApiKeyStatus[];
  v1Endpoints?: string[];
  rotationNote?: string;
  isLoading?: boolean;
}

export function ApiKeysView({ keys, v1Endpoints, rotationNote, isLoading }: ApiKeysViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="api-keys-loading">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Environment credentials</h2>
        </div>
        <div className="divide-y divide-border">
          {keys?.map((item) => (
            <div key={item.key} className="px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs font-mono text-muted-foreground">{item.key}</p>
              </div>
              <div className="flex items-center gap-2">
                {item.hint && (
                  <span className="text-xs font-mono text-muted-foreground">{item.hint}</span>
                )}
                <Badge variant={item.configured ? 'default' : item.required ? 'destructive' : 'secondary'}>
                  {item.configured ? 'Configured' : item.required ? 'Missing' : 'Not set'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {v1Endpoints && v1Endpoints.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold mb-2">Protected v1 endpoints</h2>
          <ul className="space-y-1">
            {v1Endpoints.map((endpoint) => (
              <li key={endpoint} className="text-xs font-mono text-muted-foreground">
                {endpoint}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {rotationNote && (
        <p className="text-sm text-muted-foreground">{rotationNote}</p>
      )}
    </div>
  );
}