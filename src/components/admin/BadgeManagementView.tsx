import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export interface BadgeDefinitionRow {
  id: string;
  name: string;
  description: string;
  category: string;
  earnedCount: number;
}

export interface BadgeAssignmentRow {
  id: string;
  badgeId: string;
  userEmail: string | null;
  earnedAt: string;
}

interface BadgeManagementViewProps {
  badges?: BadgeDefinitionRow[];
  recentAssignments?: BadgeAssignmentRow[];
  awardEmail?: string;
  awardBadgeId?: string;
  isLoading?: boolean;
  onAwardEmailChange?: (value: string) => void;
  onAwardBadgeIdChange?: (value: string) => void;
  onAward?: () => void;
  onRevoke?: (email: string, badgeId: string) => void;
}

export function BadgeManagementView({
  badges,
  recentAssignments,
  awardEmail = '',
  awardBadgeId = '',
  isLoading,
  onAwardEmailChange,
  onAwardBadgeIdChange,
  onAward,
  onRevoke,
}: BadgeManagementViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="badges-loading">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-3">
        <h2 className="text-sm font-semibold">Manual award</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={awardEmail}
            onChange={(e) => onAwardEmailChange?.(e.target.value)}
            placeholder="user@example.com"
            className="sm:max-w-xs"
          />
          <select
            value={awardBadgeId}
            onChange={(e) => onAwardBadgeIdChange?.(e.target.value)}
            className="h-9 rounded-md border border-border bg-transparent px-3 text-sm flex-1"
          >
            <option value="">Select badge…</option>
            {badges?.map((badge) => (
              <option key={badge.id} value={badge.id}>
                {badge.name}
              </option>
            ))}
          </select>
          <Button onClick={onAward} disabled={!awardEmail || !awardBadgeId}>
            Award badge
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Badge</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Earned</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {badges?.map((badge) => (
              <TableRow key={badge.id}>
                <TableCell className="font-medium">{badge.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{badge.category}</Badge>
                </TableCell>
                <TableCell>{badge.earnedCount}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-md">
                  {badge.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {recentAssignments && recentAssignments.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Recent assignments</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead>Earned</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAssignments.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.userEmail ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{row.badgeId}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(row.earnedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.userEmail && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRevoke?.(row.userEmail!, row.badgeId)}
                      >
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}