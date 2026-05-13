-- Topic tags: a preset list of community topics (Prayer, Theology, etc.) plus
-- M2M join tables that let channels and posts each carry up to three tags.
-- Used by /channel/browse "Browse by topic" filter, channel/post create forms,
-- and the pill rows displayed on channel + homepage feed cards.

create table if not exists public.topic_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.channel_tags (
  topic_id uuid not null references public.topics(id) on delete cascade,
  tag_id uuid not null references public.topic_tags(id) on delete cascade,
  primary key (topic_id, tag_id)
);
create index if not exists channel_tags_tag_id_idx on public.channel_tags (tag_id);

create table if not exists public.post_tags (
  topic_content_id uuid not null references public.topic_content(id) on delete cascade,
  tag_id uuid not null references public.topic_tags(id) on delete cascade,
  primary key (topic_content_id, tag_id)
);
create index if not exists post_tags_tag_id_idx on public.post_tags (tag_id);

-- Seed preset list. Idempotent via the unique slug constraint so the migration
-- can be re-applied (or merged with future tag additions) without duplicates.
insert into public.topic_tags (slug, label, display_order) values
  ('prayer', 'Prayer', 1),
  ('theology', 'Theology', 2),
  ('testimonies', 'Testimonies', 3),
  ('worship', 'Worship', 4),
  ('bible-study', 'Bible Study', 5),
  ('devotionals', 'Devotionals', 6),
  ('debates', 'Debates', 7),
  ('youth', 'Youth', 8),
  ('family', 'Family', 9),
  ('missions', 'Missions', 10)
on conflict (slug) do nothing;

-- RLS: tags are publicly readable; only the channel author (or for posts, the
-- channel author who owns the post's channel, matching the existing
-- topic_content policy style) may attach/detach tags.

alter table public.topic_tags enable row level security;
alter table public.channel_tags enable row level security;
alter table public.post_tags enable row level security;

drop policy if exists "Topic tags viewable by everyone" on public.topic_tags;
create policy "Topic tags viewable by everyone" on public.topic_tags
  for select using (true);

drop policy if exists "Channel tags viewable by everyone" on public.channel_tags;
create policy "Channel tags viewable by everyone" on public.channel_tags
  for select using (true);

drop policy if exists "Channel authors can attach tags" on public.channel_tags;
create policy "Channel authors can attach tags" on public.channel_tags
  for insert with check (
    exists (
      select 1 from public.topics t
      where t.id = channel_tags.topic_id and t.author_id = auth.uid()
    )
  );

drop policy if exists "Channel authors can detach tags" on public.channel_tags;
create policy "Channel authors can detach tags" on public.channel_tags
  for delete using (
    exists (
      select 1 from public.topics t
      where t.id = channel_tags.topic_id and t.author_id = auth.uid()
    )
  );

drop policy if exists "Post tags viewable by everyone" on public.post_tags;
create policy "Post tags viewable by everyone" on public.post_tags
  for select using (true);

-- Match the existing topic_content policy style: the post's author is also the
-- channel's author (topic_content.author_id == topics.author_id by design), so
-- gating on either author check works. We accept both — author of the post OR
-- author of the parent channel — to mirror the broader "channel owner" model
-- used elsewhere (e.g. channel_pages).
drop policy if exists "Post authors can attach tags" on public.post_tags;
create policy "Post authors can attach tags" on public.post_tags
  for insert with check (
    exists (
      select 1
      from public.topic_content tc
      left join public.topics t on t.id = tc.topic_id
      where tc.id = post_tags.topic_content_id
        and (tc.author_id = auth.uid() or t.author_id = auth.uid())
    )
  );

drop policy if exists "Post authors can detach tags" on public.post_tags;
create policy "Post authors can detach tags" on public.post_tags
  for delete using (
    exists (
      select 1
      from public.topic_content tc
      left join public.topics t on t.id = tc.topic_id
      where tc.id = post_tags.topic_content_id
        and (tc.author_id = auth.uid() or t.author_id = auth.uid())
    )
  );
