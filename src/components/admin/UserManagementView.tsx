import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface UserManagementViewProps {
  users?: any[];
  isLoading?: boolean;
  onSuspendUser?: (userId: string) => void;
  onResetCredits?: (userId: string) => void;
}

export function UserManagementView({ users, isLoading, onSuspendUser, onResetCredits }: UserManagementViewProps) {
  if (isLoading) {
    return (
      <Card className="p-0 overflow-hidden" data-testid="users-loading">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map(i => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map(user => (
            <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
              <TableCell className="font-mono text-xs">{user.id}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="sm" onClick={() => onResetCredits?.(user.id)}>Reset Credits</Button>
                <Button variant="destructive" size="sm" onClick={() => onSuspendUser?.(user.id)}>Suspend</Button>
              </TableCell>
            </TableRow>
          ))}
          {(!users || users.length === 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No users found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
