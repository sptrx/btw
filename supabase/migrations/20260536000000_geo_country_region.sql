-- Geographic identity: country-level tagging for profiles and content (no city/precise location).

alter table public.profiles
  add column if not exists country_code char(2);

comment on column public.profiles.country_code is
  'ISO 3166-1 alpha-2 home country (optional). Set from IP on sign-up; user can change.';

alter table public.topic_content
  add column if not exists country_code char(2),
  add column if not exists region text;

comment on column public.topic_content.country_code is
  'ISO 3166-1 alpha-2 where the author shared from (optional; may inherit profile home country).';
comment on column public.topic_content.region is
  'Broad region derived from country_code: africa, asia, americas, europe, oceania, middle_east';

alter table public.posts
  add column if not exists country_code char(2),
  add column if not exists region text;

alter table public.topic_content
  drop constraint if exists topic_content_region_check;

alter table public.topic_content
  add constraint topic_content_region_check check (
    region is null
    or region in ('africa', 'asia', 'americas', 'europe', 'oceania', 'middle_east')
  );

create index if not exists topic_content_country_code_created_at_idx
  on public.topic_content (country_code, created_at desc)
  where country_code is not null;

create index if not exists profiles_country_code_idx
  on public.profiles (country_code)
  where country_code is not null;

-- Aggregated map stats (approved / legacy-null moderation only)
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
  select
    tc.country_code::text,
    count(*)::bigint as post_count,
    (array_agg(tc.title order by tc.created_at desc))[1]::text as latest_post_title,
    max(tc.created_at) as latest_post_date
  from public.topic_content tc
  where tc.country_code is not null
    and length(trim(tc.country_code::text)) = 2
    and (
      tc.moderation_status is null
      or tc.moderation_status = 'approved'
    )
  group by tc.country_code;
$$;

grant execute on function public.map_country_aggregates() to anon, authenticated;
