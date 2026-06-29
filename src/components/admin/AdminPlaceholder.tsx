import { Card } from '@/components/ui/card';

interface AdminPlaceholderProps {
  title: string;
  description: string;
}

export function AdminPlaceholder({ title, description }: AdminPlaceholderProps) {
  return (
    <Card className="p-8 border-border bg-card text-center max-w-lg mx-auto">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}