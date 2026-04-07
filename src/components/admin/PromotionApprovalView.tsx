import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface PromotionApprovalViewProps {
  bookings?: any[];
  isLoading?: boolean;
  onApprove?: (bookingId: string) => void;
  onReject?: (bookingId: string) => void;
}

export function PromotionApprovalView({ bookings, isLoading, onApprove, onReject }: PromotionApprovalViewProps) {
  if (isLoading) {
    return (
      <Card className="p-0 overflow-hidden" data-testid="promotions-loading">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2].map(i => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-8 w-24" /></TableCell>
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
            <TableHead>Type</TableHead>
            <TableHead>Slot Date</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Status / Stripe</TableHead>
            <TableHead className="text-right">Approval</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings?.map(booking => (
            <TableRow key={booking.id}>
              <TableCell className="font-bold">{booking.slotType}</TableCell>
              <TableCell className="font-mono text-xs">{new Date(booking.slotDate).toLocaleDateString()}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{booking.user?.email}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold ${
                  booking.status === 'PAID' ? 'bg-green-500/20 text-green-500' :
                  booking.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
                }`}>
                  {booking.status}
                </span>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApprove?.(booking.id)}
                  disabled={booking.status !== 'PENDING'}
                  className="hover:text-green-500 hover:border-green-500"
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReject?.(booking.id)}
                  disabled={booking.status !== 'PENDING'}
                  className="hover:text-red-500 hover:border-red-500"
                >
                  Reject
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(!bookings || bookings.length === 0) && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No active bookings found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
