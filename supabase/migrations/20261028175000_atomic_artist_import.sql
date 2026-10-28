-- Atomic CSV artist import with database-level case-insensitive de-duplication.
create unique index if not exists idx_artists_name_normalized
 on public.artists (lower(btrim(name)));

create or replace function public.import_admin_artists(p_rows jsonb, p_admin_id uuid)
returns jsonb language plpgsql security invoker set search_path=public, pg_temp
as $$
declare
  requested int;
  inserted int;
begin
  if jsonb_typeof(p_rows) <> 'array' then raise exception 'Expected an array'; end if;
  requested:=jsonb_array_length(p_rows);
  if requested<1 or requested>100 then raise exception 'Import batch must contain 1..100 artists'; end if;

  with incoming as (
    select distinct on (lower(btrim(x.name)))
      btrim(x.name) as name, nullif(btrim(x."spotifyId"),'') as spotify_id,
      coalesce(x.genres,'{}'::text[]) as genres,nullif(btrim(x.country),'') as country
    from jsonb_to_recordset(p_rows)
      as x(name text,"spotifyId" text,genres text[],country text)
    where x.name is not null and btrim(x.name)<>''
    order by lower(btrim(x.name)),x.name
  ), added as (
    insert into public.artists (name,"spotifyId",genres,country,source,status,"isVisible")
    select name,spotify_id,genres,country,'csv-upload','pending_review',false
    from incoming on conflict do nothing returning id
  )
  select count(*) into inserted from added;

  insert into public.audit_logs ("adminId",action,details)
    values (p_admin_id,'ARTIST_CSV_IMPORT',
      jsonb_build_object('created',inserted,'skipped',requested-inserted));
  return jsonb_build_object('created',inserted,'skipped',requested-inserted);
end;
$$;
revoke execute on function public.import_admin_artists(jsonb,uuid) from public,anon,authenticated;
grant execute on function public.import_admin_artists(jsonb,uuid) to service_role;
