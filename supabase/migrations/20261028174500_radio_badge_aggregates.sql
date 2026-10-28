-- Server-side aggregates prevent large scans/downloads on every admin and radio request.
create or replace function public.get_admin_badge_counts()
returns table(badge_id text, earned_count bigint)
language sql stable security invoker set search_path = public, pg_temp
as $$ select "badgeId"::text, count(*)::bigint from public.user_badges group by "badgeId"; $$;
revoke execute on function public.get_admin_badge_counts() from public, anon, authenticated;
grant execute on function public.get_admin_badge_counts() to service_role;

create index if not exists idx_radio_events_source_recent
 on public.airplay_events ("observedAt" desc)
 where source = 'radio';

create or replace function public.get_radio_live_tracks(p_since timestamptz)
returns table("stationId" uuid, artist text, title text, "observedAt" timestamptz,
              genres text[], matched boolean)
language sql stable security invoker set search_path = public, pg_temp
as $$
  select s.id, coalesce(a.name, e."rawArtist"), e."rawTitle", e."observedAt",
         coalesce(a.genres,'{}'::text[]) || coalesce(r.genres,'{}'::text[]),
         e.confidence >= 0.85 and e."artistId" is not null
  from public.radio_stations s
  join lateral (
    select e."rawArtist",e."rawTitle",e."observedAt",e."artistId",e."releaseId",e.confidence
    from public.airplay_events e
    where e.source='radio' and e."sourceStationId"=s.id
      and e."observedAt">=p_since
    order by e."observedAt" desc limit 1
  ) e on true
  left join public.artists a on a.id=e."artistId"
  left join public.releases r on r.id=e."releaseId"
  where s."monitorEnabled"=true and s."isActive"=true
    and s."legalHold"=false and s."lastMetadataAt">=p_since;
$$;
revoke execute on function public.get_radio_live_tracks(timestamptz) from public, anon, authenticated;
grant execute on function public.get_radio_live_tracks(timestamptz) to service_role;

create or replace function public.get_radio_airplay_chart(
  p_since timestamptz, p_country text default '', p_genre text default '',
  p_search text default '', p_limit integer default 50
)
returns table(artist text,title text,spins bigint,stations bigint,countries text[],
              genres text[],"lastDetected" timestamptz)
language sql stable security invoker set search_path = public, pg_temp
as $$
  with observed as (
    select coalesce(a.name,e."rawArtist") as artist,
      coalesce(r.title,e."rawTitle") as title,
      e."releaseId",e."artistId",e."observedAt",s.id as station_id,s.country,
      coalesce(a.genres,'{}'::text[]) || coalesce(r.genres,'{}'::text[]) as genres
    from public.airplay_events e
    join public.radio_stations s on s.id=e."sourceStationId"
      and s."monitorEnabled" and s."isActive" and not s."legalHold"
    left join public.artists a on a.id=e."artistId"
    left join public.releases r on r.id=e."releaseId"
    where e.source='radio' and e."observedAt">=p_since
      and e."artistId" is not null and e.confidence>=0.85
      and (p_country='' or upper(s.country)=upper(p_country))
  )
  select o.artist,o.title,count(*)::bigint,count(distinct o.station_id)::bigint,
    coalesce(array_agg(distinct o.country) filter (where o.country is not null),'{}'::text[]),
    o.genres,max(o."observedAt")
  from observed o
  where o.artist is not null and o.title is not null
    and (p_search='' or o.artist ilike '%'||p_search||'%' or o.title ilike '%'||p_search||'%')
    and (p_genre='' or exists (
      select 1 from unnest(o.genres) g where
      regexp_replace(lower(g),'[^[:alnum:]]','','g') like
      '%'||regexp_replace(lower(p_genre),'[^[:alnum:]]','','g')||'%'
    ))
  group by o.artist,o.title,o."releaseId",o."artistId",o.genres
  order by count(*) desc,max(o."observedAt") desc
  limit least(greatest(p_limit,1),100);
$$;
revoke execute on function public.get_radio_airplay_chart(timestamptz,text,text,text,integer) from public, anon, authenticated;
grant execute on function public.get_radio_airplay_chart(timestamptz,text,text,text,integer) to service_role;
