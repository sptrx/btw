-- Faith-specific reactions on feed posts (channel content, prayer requests, praise reports)

create type public.post_reaction_type as enum (
  'amen',
  'blessed',
  'spirit_filled',
  'sharing',
  'praise_god'
);

create type public.feed_post_kind as enum (
  'topic_content',
  'prayer_request',
  'praise_report'
);

create table if not exists public.post_reaction (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null,
  post_kind public.feed_post_kind not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  reaction_type public.post_reaction_type not null,
  created_at timestamptz not null default now(),
  unique (post_id, post_kind, user_id)
);

create index if not exists post_reaction_post_idx
  on public.post_reaction (post_id, post_kind);
create index if not exists post_reaction_user_idx
  on public.post_reaction (user_id, created_at desc);

comment on table public.post_reaction is
  'One faith reaction per user per post (channel content, prayer request, or praise report).';

alter table public.post_reaction enable row level security;

drop policy if exists "Post reactions viewable by everyone" on public.post_reaction;
create policy "Post reactions viewable by everyone"
  on public.post_reaction for select using (true);

drop policy if exists "Users can set own post reaction" on public.post_reaction;
create policy "Users can set own post reaction"
  on public.post_reaction for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own post reaction" on public.post_reaction;
create policy "Users can update own post reaction"
  on public.post_reaction for update using (auth.uid() = user_id);

drop policy if exists "Users can remove own post reaction" on public.post_reaction;
create policy "Users can remove own post reaction"
  on public.post_reaction for delete using (auth.uid() = user_id);

-- Tag for Revelations filter on the community feed
insert into public.topic_tags (slug, label, display_order)
values ('revelation', 'Revelation', 11)
on conflict (slug) do nothing;
