-- "Featured on homepage" is now an editorial choice (site owner / moderators),
-- not something each author can switch on for their own post.
--
-- Same rule as moderation_status: ordinary users (PostgREST anon/authenticated)
-- cannot set or change topic_content.is_featured; moderators and trusted callers
-- (SQL editor, service role) can. To feature a post, run in the Supabase SQL editor:
--   update public.topic_content set is_featured = true where id = '<post id>';
-- and to remove it, set is_featured = false.

create or replace function public.topic_content_guard_moderation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new; -- trusted caller (server after AI moderation, SQL editor)
  end if;
  if public.is_site_moderator() then
    return new; -- moderators review and feature content
  end if;

  if tg_op = 'INSERT' then
    new.moderation_status := 'pending_review';
    new.moderation_note := null;
    new.is_featured := false;
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
  new.is_featured := old.is_featured;
  return new;
end;
$$;
