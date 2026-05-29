-- Social follow graph: follow people (not just channels), public usernames, profile privacy toggle.

-- Username for /u/[username] profile URLs
alter table public.profiles
  add column if not exists username text,
  add column if not exists profile_private boolean not null default false;

comment on column public.profiles.username is 'Unique handle for public profile URL /u/[username].';
comment on column public.profiles.profile_private is 'When true, profile content may be restricted in future; follower counts stay public.';

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (
    username is null
    or (
      char_length(username) >= 3
      and char_length(username) <= 30
      and username ~ '^[a-zA-Z0-9]([a-zA-Z0-9_-]*[a-zA-Z0-9])?$'
    )
  );

create or replace function public.profile_default_username(uid uuid, display_name text)
returns text
language plpgsql
as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := lower(regexp_replace(coalesce(nullif(trim(display_name), ''), 'member'), '[^a-z0-9]+', '-', 'g'));
  base := trim(both '-' from base);
  if char_length(base) < 3 then
    base := 'member';
  end if;
  base := left(base, 24);
  candidate := base;
  while exists (
    select 1 from public.profiles p where lower(p.username) = lower(candidate) and p.id <> uid
  ) loop
    n := n + 1;
    candidate := base || '-' || n::text;
  end loop;
  return candidate;
end;
$$;

-- Backfill usernames for existing profiles
update public.profiles p
set username = public.profile_default_username(p.id, p.display_name)
where p.username is null;

alter table public.profiles alter column username set not null;

-- New signups get a username automatically
create or replace function public.handle_new_user()
returns trigger as $$
declare
  dn text;
  un text;
begin
  dn := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  un := public.profile_default_username(new.id, dn);
  insert into public.profiles (id, display_name, username)
  values (new.id, dn, un);
  return new;
end;
$$ language plpgsql security definer;

-- user_follow: follower follows following
create table if not exists public.user_follow (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_follow_no_self check (follower_id <> following_id),
  constraint user_follow_unique unique (follower_id, following_id)
);

create index if not exists user_follow_follower_idx on public.user_follow (follower_id);
create index if not exists user_follow_following_idx on public.user_follow (following_id);

alter table public.user_follow enable row level security;

drop policy if exists "Anyone can read follow graph" on public.user_follow;
create policy "Anyone can read follow graph"
  on public.user_follow for select
  using (true);

drop policy if exists "Users follow others" on public.user_follow;
create policy "Users follow others"
  on public.user_follow for insert
  with check (auth.uid() = follower_id);

drop policy if exists "Users unfollow" on public.user_follow;
create policy "Users unfollow"
  on public.user_follow for delete
  using (auth.uid() = follower_id);

-- Notification when someone follows you
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('comment', 'like', 'moderation_rejected', 'follow'));

-- Dedupe follow notifications (re-follow after unfollow gets a new row; same pair won't duplicate while row exists)
create unique index if not exists notifications_follow_unique_idx
  on public.notifications (recipient_id, actor_id)
  where type = 'follow';
