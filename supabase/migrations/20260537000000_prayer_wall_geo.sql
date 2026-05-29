-- Country-level tagging for Prayer Wall requests (optional; inherits profile home country).

alter table public.prayer_request
  add column if not exists country_code char(2),
  add column if not exists region text;

comment on column public.prayer_request.country_code is
  'ISO 3166-1 alpha-2 where the author is praying from (optional; may inherit profile). Hidden when is_anonymous.';
comment on column public.prayer_request.region is
  'Broad region derived from country_code: africa, asia, americas, europe, oceania, middle_east';

alter table public.prayer_request
  drop constraint if exists prayer_request_region_check;

alter table public.prayer_request
  add constraint prayer_request_region_check check (
    region is null
    or region in ('africa', 'asia', 'americas', 'europe', 'oceania', 'middle_east')
  );

create index if not exists prayer_request_country_code_created_at_idx
  on public.prayer_request (country_code, created_at desc)
  where country_code is not null;

-- Map aggregates: channel posts + public (non-anonymous) prayer requests
create or replace function public.map_country_aggregates()
returns table (
  country_code text,
  post_count bigint,
  latest_post_title text,
  latest_post_date timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with combined as (
    select
      tc.country_code::text as country_code,
      tc.title::text as title,
      tc.created_at
    from public.topic_content tc
    where tc.country_code is not null
      and length(trim(tc.country_code::text)) = 2
      and (
        tc.moderation_status is null
        or tc.moderation_status = 'approved'
      )
    union all
    select
      pr.country_code::text,
      pr.title::text,
      pr.created_at
    from public.prayer_request pr
    where pr.country_code is not null
      and length(trim(pr.country_code::text)) = 2
      and pr.is_anonymous = false
      and pr.moderation_status = 'approved'
      and pr.status in ('active', 'answered')
  )
  select
    country_code,
    count(*)::bigint as post_count,
    (array_agg(title order by created_at desc))[1]::text as latest_post_title,
    max(created_at) as latest_post_date
  from combined
  group by country_code;
$$;

grant execute on function public.map_country_aggregates() to anon, authenticated;
