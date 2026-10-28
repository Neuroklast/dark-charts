'use client';

import { useCallback,useEffect,useState } from 'react';
import { authFetch } from '@/lib/auth/client-fetch';
import { Button } from '@/components/ui/button';

type Job = { id:string;entity:string;operation:string;status:string;processed:number;total:number;
  affected:number;createdAt:string };

export function AdminBulkJobHistory({ onOpen,refreshKey }: {
  onOpen: (jobId:string)=>void;refreshKey?: string | null;
}) {
  const [jobs,setJobs]=useState<Job[]>([]);
  const load=useCallback(async()=>{
    try {
      const res=await authFetch('/api/admin/catalog/jobs',{ cache:'no-store' });
      if (res.ok) setJobs(((await res.json()) as { jobs:Job[] }).jobs ?? []);
    } catch { /* The live progress panel reports its own errors. */ }
  },[]);
  useEffect(()=>{ void load(); },[load,refreshKey]);
  if (jobs.length===0) return null;
  return <details className="rounded-md border border-border px-3 py-2 text-sm">
    <summary className="cursor-pointer font-medium">Letzte Sammelaktionen ({jobs.length})</summary>
    <div className="mt-2 max-h-52 space-y-1 overflow-auto">
      {jobs.map(job=><div key={job.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2">
        <span>{job.entity==='artists'?'Artists':'Releases'} · {job.operation==='approve'?'Freigeben':'Verbergen'} ·
          {job.processed}/{job.total} · {job.status}</span>
        <Button type="button" size="sm" variant="outline" onClick={()=>onOpen(job.id)}>Details</Button>
      </div>)}
    </div>
    <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={()=>void load()}>Aktualisieren</Button>
  </details>;
}
