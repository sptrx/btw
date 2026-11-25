-- Short videos (up to 90 s), stored on Cloudflare Stream and reviewed before they show in the feed.

create table if not exists public.shorts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users on delete cascade,
  caption text not null default '' check (char_length(caption) <= 280),
  stream_uid text unique,
  status text not null default 'uploading'
    check (status in ('uploading', 'processing', 'pending_review', 'approved', 'rejected', 'failed')),
  duration_seconds numeric,
  thumbnail_url text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists shorts_feed_idx
  on public.shorts (created_at desc) where status = 'approved';
create index if not exists shorts_author_idx on public.shorts (author_id, created_at desc);
create index if not exists shorts_review_idx
  on public.shorts (created_at) where status = 'pending_review';

alter table public.shorts enable row level security;

drop policy if exists "Shorts viewable when approved, own, or moderator" on public.shorts;
create policy "Shorts viewable when approved, own, or moderator"
  on public.shorts for select
  using (status = 'approved' or author_id = auth.uid() or public.is_site_moderator());

drop policy if exists "Users insert own shorts" on public.shorts;
create policy "Users insert own shorts"
  on public.shorts for insert
  with check (author_id = auth.uid() and status = 'uploading');

drop policy if exists "Authors and moderators update shorts" on public.shorts;
create policy "Authors and moderators update shorts"
  on public.shorts for update
  using (author_id = auth.uid() or public.is_site_moderator())
  with check (author_id = auth.uid() or public.is_site_moderator());

drop policy if exists "Authors and moderators delete shorts" on public.shorts;
create policy "Authors and moderators delete shorts"
  on public.shorts for delete
  using (author_id = auth.uid() or public.is_site_moderator());

-- Authors may move their own short forward to review, but never approve it,
-- re-open a decision, or swap the video behind it.
create or replace function public.shorts_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- service_role (webhook, server finalize) and moderators are trusted.
  if current_user = 'service_role' or public.is_site_moderator() then
    return new;
  end if;
  if new.author_id is distinct from old.author_id
     or new.approved_at is distinct from old.approved_at
     or new.rejection_reason is distinct from old.rejection_reason
     or (old.stream_uid is not null and new.stream_uid is distinct from old.stream_uid) then
    raise exception 'not allowed';
  end if;
  if new.status is distinct from old.status then
    if old.status in ('approved', 'rejected') or new.status in ('approved', 'rejected') then
      raise exception 'not allowed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists shorts_guard_trg on public.shorts;
create trigger shorts_guard_trg
  before update on public.shorts
  for each row execute function public.shorts_guard();

grant select on public.shorts to anon, authenticated;
grant insert, update, delete on public.shorts to authenticated;
grant all on public.shorts to service_role;
