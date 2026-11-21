-- Security hardening (2026-11-21)
--  1. Users can no longer give themselves the 'moderator' role.
--  2. AI moderation is enforced in the database, not only in the app:
--     - authors cannot set moderation_status / moderation_note themselves
--     - pending / rejected posts are hidden from everyone but the author and moderators
--     - comments can only be written by the server (after moderation)
--  3. Bible AI daily quota is consumed atomically by the server; users can no
--     longer reset their own counter.
--
-- "Trusted" callers below = anything that is not a PostgREST request as anon /
-- authenticated: the service role key, the SQL editor, SECURITY DEFINER functions
-- and Supabase Auth triggers.
--
-- DEPLOY NOTE: the app now needs SUPABASE_SERVICE_ROLE_KEY (server-only secret)
-- to approve posts, write comments and count Bible AI usage. Set it before /
-- together with applying this migration.

-- ---------------------------------------------------------------------------
-- Helper: is the current user a site moderator?
-- ---------------------------------------------------------------------------
create or replace function public.is_site_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'moderator'
  );
$$;

revoke all on function public.is_site_moderator() from public;
grant execute on function public.is_site_moderator() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 1. profiles.role guard
-- ---------------------------------------------------------------------------
create or replace function public.profiles_guard_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new; -- trusted caller
  end if;

  if tg_op = 'INSERT' then
    if new.role is not null and new.role not in ('user', 'channel_author') then
      raise exception 'Not allowed to set role %', new.role using errcode = '42501';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role then
    if old.role = 'moderator' or new.role not in ('user', 'channel_author') then
      raise exception 'Not allowed to change role to %', new.role using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before insert or update of role on public.profiles
  for each row execute function public.profiles_guard_role();

-- ---------------------------------------------------------------------------
-- 2a. topic_content: authors cannot set their own moderation status
-- ---------------------------------------------------------------------------
create or replace function public.topic_content_guard_moderation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new; -- trusted caller (server after AI moderation)
  end if;
  if public.is_site_moderator() then
    return new; -- moderators review content from the dashboard
  end if;

  if tg_op = 'INSERT' then
    new.moderation_status := 'pending_review';
    new.moderation_note := null;
    return new;
  end if;

  -- UPDATE by the author: any change to what readers see goes back to review;
  -- otherwise (e.g. moving to another page) the current status is kept.
  if (new.title, new.body, new.media_urls, new.type, new.scripture_reference)
     is distinct from
     (old.title, old.body, old.media_urls, old.type, old.scripture_reference) then
    new.moderation_status := 'pending_review';
    new.moderation_note := null;
  else
    new.moderation_status := old.moderation_status;
    new.moderation_note := old.moderation_note;
  end if;
  return new;
end;
$$;

drop trigger if exists topic_content_guard_moderation on public.topic_content;
create trigger topic_content_guard_moderation
  before insert or update on public.topic_content
  for each row execute function public.topic_content_guard_moderation();

-- 2b. Only approved content is public (same rule prayer_request already uses).
drop policy if exists "Topic content is viewable by everyone" on public.topic_content;
drop policy if exists "Topic content viewable when approved, own, or moderator" on public.topic_content;
create policy "Topic content viewable when approved, own, or moderator"
  on public.topic_content
  for select
  using (
    moderation_status = 'approved'
    or moderation_status is null
    or auth.uid() = author_id
    or (select public.is_site_moderator())
  );

-- 2c. Comments are written only by the server after moderation.
--     (Reading and deleting your own comment are unchanged.)
drop policy if exists "Authenticated can comment" on public.topic_content_comments;
drop policy if exists "Users can update own comments" on public.topic_content_comments;

-- ---------------------------------------------------------------------------
-- 3. Bible AI daily quota: atomic, server-only
-- ---------------------------------------------------------------------------
drop policy if exists "Users insert own bible ai usage" on public.bible_ai_daily_usage;
drop policy if exists "Users update own bible ai usage" on public.bible_ai_daily_usage;

create or replace function public.consume_bible_ai_quota(
  p_user_id uuid,
  p_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('utc', now()))::date;
  v_count integer;
begin
  if p_user_id is null or p_limit is null or p_limit < 1 then
    return jsonb_build_object('allowed', false, 'remaining', 0);
  end if;

  insert into public.bible_ai_daily_usage as u (user_id, usage_date, request_count)
  values (p_user_id, v_today, 1)
  on conflict (user_id, usage_date) do update
    set request_count = u.request_count + 1
    where u.request_count < p_limit
  returning u.request_count into v_count;

  if v_count is null then
    return jsonb_build_object('allowed', false, 'remaining', 0);
  end if;
  return jsonb_build_object('allowed', true, 'remaining', greatest(0, p_limit - v_count));
end;
$$;

revoke all on function public.consume_bible_ai_quota(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_bible_ai_quota(uuid, integer) to service_role;
