import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminPagination } from './shared/AdminPagination';

export interface VoteRow {
  id: string;
  createdAt: string;
  userEmail: string | null;
  nickname?: string | null;
  releaseTitle: string | null;
  artistName: string | null;
  allocatedVotes?: number;
  cost?: number;
  credits?: number;
  rating?: number;
  rank?: number;
}

interface VoteInspectorViewProps {
  votes?: VoteRow[];
  total?: number;
  type?: 'fan' | 'expert';
  weekOnly?: boolean;
  isLoading?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onTypeChange?: (type: 'fan' | 'expert') => void;
  onWeekOnlyChange?: (weekOnly: boolean) => void;
}

export function VoteInspectorView({
  votes,
  total = 0,
  type = 'fan',
  weekOnly = true,
  isLoading,
  page = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onTypeChange,
  onWeekOnlyChange,
}: VoteInspectorViewProps) {
  if (isLoading && !votes?.length) {
    return (
      <div className="space-y-4" data-testid="votes-loading">
        <Skeleton className="h-10 w-64" />
        <Card className="p-0 overflow-hidden">
          <Skeleton className="h-48 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          size="sm"
          variant={type === 'fan' ? 'default' : 'outline'}
          onClick={() => onTypeChange?.('fan')}
        >
          Fan votes
        </Button>
        <Button
          size="sm"
          variant={type === 'expert' ? 'default' : 'outline'}
          onClick={() => onTypeChange?.('expert')}
        >
          Expert votes
        </Button>
        <Button
          size="sm"
          variant={weekOnly ? 'secondary' : 'outline'}
          onClick={() => onWeekOnlyChange?.(!weekOnly)}
        >
          {weekOnly ? 'This week only' : 'All time'}
        </Button>
        <Badge variant="outline">{total.toLocaleString()} votes</Badge>
      </div>

      <AdminPagination page={page} pageSize={pageSize} total={total}
        onPageChange={onPageChange ?? (() => {})} onPageSizeChange={onPageSizeChange} />
      <Card className="p-0 max-h-[62vh] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Release</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead className="text-right">
                {type === 'fan' ? 'Votes / Cost' : 'Rating / Rank'}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {votes?.length ? (
              votes.map((vote) => (
                <TableRow key={vote.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(vote.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{vote.userEmail ?? '—'}</div>
                    {vote.nickname && (
                      <div className="text-xs text-muted-foreground">{vote.nickname}</div>
                    )}
                  </TableCell>
                  <TableCell>{vote.releaseTitle ?? '—'}</TableCell>
                  <TableCell>{vote.artistName ?? '—'}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {type === 'fan'
                      ? `${vote.allocatedVotes ?? 0} / ${vote.cost ?? 0}`
                      : `${vote.rating ?? '—'} / #${vote.rank ?? '—'}`}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No votes found for this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <AdminPagination page={page} pageSize={pageSize} total={total}
        onPageChange={onPageChange ?? (() => {})} onPageSizeChange={onPageSizeChange} />
    </div>
  );
}