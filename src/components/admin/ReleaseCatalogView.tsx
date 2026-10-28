import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminPagination } from './shared/AdminPagination';
import { AdminBulkToolbar } from './shared/AdminBulkToolbar';

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
  isRefreshing?: boolean;
  page?: number;
  pageSize?: number;
  selectedIds?: string[];
  allMatching?: boolean;
  isBusy?: boolean;
  onSelect?: (ids: string[]) => void;
  onAllMatchingChange?: (enabled: boolean) => void;
  onBulkApprove?: () => void;
  onBulkHide?: () => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onRefresh?: () => void;
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
  isRefreshing,
  page = 0,
  pageSize = 10,
  selectedIds = [],
  allMatching = false,
  isBusy = false,
  onSelect,
  onAllMatchingChange,
  onBulkApprove,
  onBulkHide,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onSearchChange,
  onVisibilityChange,
  onToggleVisibility,
  onDelete,
  onSyncArtwork,
}: ReleaseCatalogViewProps) {
  if (isLoading && !releases?.length) {
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
        <Button variant="outline" size="sm" disabled={isRefreshing} onClick={onRefresh}>Refresh</Button>
        <Button variant="secondary" size="sm" onClick={onSyncArtwork}>
          Sync artwork batch
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{total.toLocaleString()} releases</p>
      <AdminBulkToolbar visibleIds={(releases ?? []).map(row => row.id)} selectedIds={selectedIds}
        total={total} allMatching={allMatching} busy={isBusy}
        onSelect={onSelect ?? (() => {})} onAllMatchingChange={onAllMatchingChange ?? (() => {})}
        onApprove={onBulkApprove ?? (() => {})} onHide={onBulkHide ?? (() => {})} />
      <AdminPagination page={page} pageSize={pageSize} total={total} disabled={isBusy}
        onPageChange={onPageChange ?? (() => {})} onPageSizeChange={onPageSizeChange} />

      <Card className="p-0 max-h-[62vh] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead>Select</TableHead>
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
                  <TableCell><Checkbox aria-label={`Select ${release.title}`}
                    checked={allMatching || selectedIds.includes(release.id)}
                    disabled={isBusy}
                    onCheckedChange={checked => {
                      onAllMatchingChange?.(false);
                      onSelect?.(checked ? [...new Set([...selectedIds, release.id])] : selectedIds.filter(id => id !== release.id));
                    }} /></TableCell>
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
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No releases found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <AdminPagination page={page} pageSize={pageSize} total={total} disabled={isBusy}
        onPageChange={onPageChange ?? (() => {})} onPageSizeChange={onPageSizeChange} />
    </div>
  );
}