-- Archive: hide a channel or a page (and the posts in it) from the public without
-- deleting anything. The owner and site moderators can still see and restore it.
--
--   topics.archived_at / channel_pages.archived_at   null = live, timestamp = archived
--
-- Enforced in row-level security, so every public list, feed, search and the sitemap
-- hides archived content, not just the pages the app remembers to filter.

alter table public.topics        add column if not exists archived_at timestamptz;
alter table public.channel_pages add column if not exists archived_at timestamptz;

create index if not exists topics_archived_at_idx
  on public.topics (archived_at) where archived_at is not null;
create index if not exists channel_pages_archived_at_idx
  on public.channel_pages (archived_at) where archived_at is not null;

-- Helpers read the tables directly (security definer) so a policy on one table can
-- ask about the other without being filtered by that table's own policy.
create or replace function public.channel_is_archived(p_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.topics t
    where t.id = p_channel_id and t.archived_at is not null
  );
$$;

create or replace function public.content_is_archived(p_channel_id uuid, p_page_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (select 1 from public.topics t
            where t.id = p_channel_id and t.archived_at is not null)
    or (p_page_id is not null and exists (
          select 1 from public.channel_pages p
          where p.id = p_page_id and p.archived_at is not null));
$$;

revoke all on function public.channel_is_archived(uuid) from public;
revoke all on function public.content_is_archived(uuid, uuid) from public;
grant execute on function public.channel_is_archived(uuid) to anon, authenticated, service_role;
grant execute on function public.content_is_archived(uuid, uuid) to anon, authenticated, service_role;

-- Channels: public unless archived; owner and moderators always.
drop policy if exists "Topics are viewable by everyone" on public.topics;
drop policy if exists "Topics viewable unless archived" on public.topics;
create policy "Topics viewable unless archived"
  on public.topics
  for select
  using (
    archived_at is null
    or auth.uid() = author_id
    or (select public.is_site_moderator())
  );

-- Pages: hidden when the page or its whole channel is archived.
drop policy if exists "Channel pages viewable by everyone" on public.channel_pages;
drop policy if exists "Channel pages viewable unless archived" on public.channel_pages;
create policy "Channel pages viewable unless archived"
  on public.channel_pages
  for select
  using (
    (archived_at is null and not public.channel_is_archived(channel_id))
    or exists (
      select 1 from public.topics t
      where t.id = channel_pages.channel_id and t.author_id = auth.uid()
    )
    or (select public.is_site_moderator())
  );

-- Posts: approved AND not inside an archived channel or page; authors and
-- moderators keep access (replaces the policy from the security-hardening migration).
drop policy if exists "Topic content viewable when approved, own, or moderator" on public.topic_content;
drop policy if exists "Topic content viewable when approved, live, own, or moderator" on public.topic_content;
create policy "Topic content viewable when approved, live, own, or moderator"
  on public.topic_content
  for select
  using (
    (
      (moderation_status = 'approved' or moderation_status is null)
      and not public.content_is_archived(topic_id, page_id)
    )
    or auth.uid() = author_id
    or (select public.is_site_moderator())
  );
