'use client';

import { useMemo, useState } from 'react';
import { PromotionApprovalView } from './PromotionApprovalView';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';
import { useAdminList } from './shared/useAdminList';

type Booking = { id: string; status: string; slotType: string; slotDate: string;
  user?: { email?: string } };

export function PromotionApprovalContainer() {
  const [page,setPage] = useState(0);
  const [pageSize,setPageSize] = useState(10);
  const [busyId,setBusyId] = useState<string | null>(null);
  const params=useMemo(()=>new URLSearchParams({
    page:String(page),limit:String(pageSize),
  }).toString(),[page,pageSize]);
  const { rows,total,loading,setRows }=useAdminList<Booking>(
    '/api/admin/promotions?'+params,
    json=>({ rows:json.bookings ?? [],total:json.total ?? 0 }),
    message=>toast.error(message)
  );
  async function handleUpdateStatus(bookingId:string,status:string) {
    if (busyId) return;
    const previous=rows.find(row=>row.id===bookingId);
    setBusyId(bookingId);
    setRows(list=>list.map(row=>row.id===bookingId ? { ...row,status } : row));
    try {
      const res=await authFetch('/api/admin/promotions',{
        method:'POST',headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ action:'update_status',bookingId,status }),
      });
      if (!res.ok) throw new Error('Booking update failed');
      toast.success(`Booking ${status.toLowerCase()}`);
    } catch {
      if (previous) setRows(list=>list.map(row=>row.id===bookingId ? previous : row));
      toast.error('Failed to update booking status');
    } finally { setBusyId(null); }
  }
  return <PromotionApprovalView bookings={rows} total={total} page={page} pageSize={pageSize}
    busyId={busyId} isLoading={loading}
    onPageChange={setPage} onPageSizeChange={n=>{setPage(0);setPageSize(n);}}
    onApprove={id=>void handleUpdateStatus(id,'PAID')}
    onReject={id=>void handleUpdateStatus(id,'CANCELLED')}/>;
}
