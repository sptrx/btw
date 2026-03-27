-- Curated home page: featured channels + editorial copy (edit in Supabase Dashboard or sync from a headless CMS).
-- Writes use the service role / Dashboard; anon + authenticated users can only read.

create table if not exists public.site_home_featured (
  channel_id uuid not null references public.topics (id) on delete cascade,
  sort_order int not null default 0,
  card_subtitle text,
  primary key (channel_id)
);

create index if not exists site_home_featured_sort_idx on public.site_home_featured (sort_order);

alter table public.site_home_featured enable row level security;

create policy "site_home_featured_select_all"
  on public.site_home_featured
  for select
  using (true);

-- Singleton row for intro strip (replace copy without touching code)
create table if not exists public.site_home_copy (
  id int primary key check (id = 1),
  intro_headline text,
  intro_body text,
  updated_at timestamptz default now()
);

alter table public.site_home_copy enable row level security;

create policy "site_home_copy_select_all"
  on public.site_home_copy
  for select
  using (true);

insert into public.site_home_copy (id, intro_headline, intro_body)
values (
  1,
  'A calm place to discover, share, and grow—moderated for safety, designed for depth.',
  'Featured channels below are curated in the database. Replace this text in the site_home_copy table or connect a headless CMS that syncs into these tables.'
)
on conflict (id) do nothing;
