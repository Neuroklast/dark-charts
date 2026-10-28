-- Durable moderation jobs. One atomic database transaction processes each 50-record batch.
create table if not exists public.admin_bulk_jobs (
  id uuid primary key default gen_random_uuid(),
  "adminId" uuid not null references public.users(id) on delete cascade,
  entity text not null check (entity in ('artists','releases')),
  operation text not null check (operation in ('approve','hide')),
  "targetIds" uuid[] not null check (cardinality("targetIds") between 1 and 1000),
  total integer not null check (total between 1 and 1000),
  cursor integer not null default 0,
  processed integer not null default 0,
  affected integer not null default 0,
  skipped integer not null default 0,
  status text not null default 'queued' check (status in ('queued','running','completed','failed')),
  error text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "finishedAt" timestamptz
);
create index if not exists idx_admin_bulk_jobs_pending
 on public.admin_bulk_jobs ("createdAt") where status in ('queued','running');
create index if not exists idx_admin_bulk_jobs_admin
 on public.admin_bulk_jobs ("adminId","createdAt" desc);
alter table public.admin_bulk_jobs enable row level security;
revoke all on public.admin_bulk_jobs from public, anon, authenticated;
grant select, insert, update, delete on public.admin_bulk_jobs to service_role;

create or replace function public.process_admin_bulk_job()
returns jsonb language plpgsql security invoker set search_path = public, pg_temp
as $$
declare
  j public.admin_bulk_jobs%rowtype;
  batch_ids uuid[];
  eligible uuid[];
  batch_size int;
  changed int;
  is_complete boolean;
begin
  select * into j from public.admin_bulk_jobs
   where status in ('queued','running')
   order by "createdAt", id for update skip locked limit 1;
  if not found then return jsonb_build_object('worked',false); end if;

  batch_ids := j."targetIds"[j.cursor+1:least(j.total,j.cursor+50)];
  batch_size := coalesce(cardinality(batch_ids),0);
  if batch_size = 0 then
    update public.admin_bulk_jobs set status='completed',"finishedAt"=now(),"updatedAt"=now()
      where id=j.id;
    return jsonb_build_object('worked',true,'jobId',j.id,'status','completed');
  end if;

  if j.entity='artists' then
    select array_agg(a.id) into eligible from public.artists a
     where a.id=any(batch_ids) and a.status not in ('BANNED','RESTRICTED')
      and a."isVisible" <> (j.operation='approve');
    if j.operation='hide' then
      update public.releases set "isVisible"=false,"updatedAt"=now()
        where "artistId"=any(eligible) and "isVisible"=true;
    end if;
    update public.artists set "isVisible"=(j.operation='approve'),
      status=(case when j.operation='approve' then 'active' else 'inactive' end),
      "updatedAt"=now() where id=any(eligible);
    if j.operation='approve' then
      insert into public.sync_queue ("artistId","jobType",status)
       select id,'full','pending' from unnest(coalesce(eligible,'{}'::uuid[])) id
       where not exists (select 1 from public.sync_queue q where q."artistId"=id
                        and q.status in ('pending','processing','running'));
    end if;
  else
    select array_agg(r.id) into eligible from public.releases r
      join public.artists a on a.id=r."artistId"
      where r.id=any(batch_ids) and r."isVisible"<>(j.operation='approve')
        and (j.operation='hide' or (a."isVisible" and a.status='active'));
    update public.releases set "isVisible"=(j.operation='approve'),"updatedAt"=now()
      where id=any(eligible);
  end if;

  changed:=coalesce(cardinality(eligible),0);
  insert into public.audit_logs ("adminId",action,details) values
   (j."adminId",'CATALOG_BULK_' || upper(j.operation),
     jsonb_build_object('entity',j.entity,'ids',coalesce(eligible,'{}'::uuid[]),
                        'jobId',j.id,'batch',j.cursor/50+1));
  is_complete:=j.cursor+batch_size>=j.total;
  update public.admin_bulk_jobs set
    cursor=cursor+batch_size,processed=processed+batch_size,
    affected=affected+changed,skipped=skipped+batch_size-changed,
    status=case when is_complete then 'completed' else 'running' end,
    "finishedAt"=case when is_complete then now() else null end,
    "updatedAt"=now(),error=null where id=j.id;
  return jsonb_build_object('worked',true,'jobId',j.id,
    'status',case when is_complete then 'completed' else 'running' end,
    'processed',j.cursor+batch_size,'total',j.total);
exception when others then
  if j.id is not null then
    update public.admin_bulk_jobs set status='failed',error=left(sqlerrm,500),
      "updatedAt"=now() where id=j.id;
    return jsonb_build_object('worked',true,'jobId',j.id,'status','failed','error',left(sqlerrm,500));
  end if;
  raise;
end;
$$;
revoke execute on function public.process_admin_bulk_job() from public, anon, authenticated;
grant execute on function public.process_admin_bulk_job() to service_role;
