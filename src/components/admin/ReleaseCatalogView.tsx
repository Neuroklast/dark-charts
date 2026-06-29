import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export interface AdminRelease {
  id: string;
  title: string;
  releaseDate: string | null;
  isVisible: boolean;
  itunesArtworkUrl?: string | null;
  artist?: { id: string; name: string } | null;
}

interface ReleaseCatalogViewProps {
  releases?: AdminRelease[];
  total?: number;
  search?: string;
  visibility?: string;
  isLoading?: boolean;
  onSearchChange?: (value: string) => void;
  onVisibilityChange?: (value: string) => void;
  onToggleVisibility?: (releaseId: string, isVisible: boolean) => void;
  onDelete?: (releaseId: string) => void;
  onSyncArtwork?: () => void;
}

export function ReleaseCatalogView({
  releases,
  total = 0,
  search = '',
  visibility = 'all',
  isLoading,
  onSearchChange,
  onVisibilityChange,
  onToggleVisibility,
  onDelete,
  onSyncArtwork,
}: ReleaseCatalogViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="releases-loading">
        <Skeleton className="h-10 w-full max-w-md" />
        <Card className="p-0 overflow-hidden">
          <Skeleton className="h-48 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <Input
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search releases…"
            className="max-w-sm"
          />
          <select
            value={visibility}
            onChange={(e) => onVisibilityChange?.(e.target.value)}
            className="h-9 rounded-md border border-border bg-transparent px-3 text-sm"
          >
            <option value="all">All visibility</option>
            <option value="visible">Visible only</option>
            <option value="hidden">Hidden only</option>
          </select>
        </div>
        <Button variant="secondary" size="sm" onClick={onSyncArtwork}>
          Sync artwork batch
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{total.toLocaleString()} releases</p>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {releases?.length ? (
              releases.map((release) => (
                <TableRow key={release.id}>
                  <TableCell className="font-medium">{release.title}</TableCell>
                  <TableCell>{release.artist?.name ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {release.releaseDate
                      ? new Date(release.releaseDate).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={release.isVisible ? 'default' : 'secondary'}>
                      {release.isVisible ? 'Visible' : 'Hidden'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggleVisibility?.(release.id, !release.isVisible)}
                    >
                      {release.isVisible ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete?.(release.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No releases found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}