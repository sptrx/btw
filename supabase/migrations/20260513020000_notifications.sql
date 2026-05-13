-- Notifications: in-app alerts when someone engages with a user's content.
--
-- For now we model two notification types ("comment" and "like") that target
-- a `topic_content` post. We keep the schema flexible so new types (replies,
-- follows, mentions, …) can be added later without another migration.
--
-- Key design choices:
--   * `recipient_id` is the user who should see the bell badge tick up.
--   * `actor_id` is who did the thing (commented, liked). We always skip
--     self-actions in the application layer so authors don't get notified
--     of their own activity.
--   * `read_at` is null until the recipient opens the bell, then we set it
--     once for all rows. Storing a timestamp (vs. a boolean) lets us show
--     "seen 2 days ago" UI later without another migration.
--   * For likes we add a partial-unique index on (recipient, actor, content)
--     so unlike→relike cycles can't spam the bell. Comments stay un-deduped
--     because every new comment is a real new event.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('comment', 'like')),
  topic_content_id uuid references public.topic_content(id) on delete cascade,
  comment_id uuid references public.topic_content_comments(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id)
  where read_at is null;

-- Dedupe like notifications: one row per (recipient, actor, post) like-pair.
-- Comments are deliberately excluded — every comment should notify.
create unique index if not exists notifications_like_unique_idx
  on public.notifications (recipient_id, actor_id, topic_content_id)
  where type = 'like';

alter table public.notifications enable row level security;

-- Recipients can read and update (mark read) their own rows. We do not allow
-- direct INSERT from clients — notifications are only written from server
-- actions running with the session user, which checks happen above the RLS
-- layer. We still need an insert policy for that authenticated client to be
-- able to write rows where `actor_id = auth.uid()` (the actor is always the
-- signed-in user creating a comment/like).
drop policy if exists "Recipients read own notifications" on public.notifications;
create policy "Recipients read own notifications"
  on public.notifications for select
  using (auth.uid() = recipient_id);

drop policy if exists "Recipients update own notifications" on public.notifications;
create policy "Recipients update own notifications"
  on public.notifications for update
  using (auth.uid() = recipient_id);

drop policy if exists "Actors create notifications" on public.notifications;
create policy "Actors create notifications"
  on public.notifications for insert
  with check (auth.uid() = actor_id);

drop policy if exists "Recipients delete own notifications" on public.notifications;
create policy "Recipients delete own notifications"
  on public.notifications for delete
  using (auth.uid() = recipient_id);
