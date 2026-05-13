-- GDPR compliance: let an authenticated user delete their own account.
--
-- We can't grant `delete` on `auth.users` to the `authenticated` role (and
-- shouldn't — that would let any signed-in user delete any other user). Instead
-- we expose a `security definer` function that only deletes the *current*
-- caller (`auth.uid()`). All `public.*` tables referencing `auth.users(id)`
-- already use `on delete cascade`, so removing the auth row also wipes the
-- user's profile, posts, comments, notifications, etc.
--
-- The function is locked to the `authenticated` role and runs with a fixed
-- search_path (mitigates the classic SECURITY DEFINER search_path hijack).

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_current_user() from public;
revoke execute on function public.delete_current_user() from anon;
grant execute on function public.delete_current_user() to authenticated;

comment on function public.delete_current_user() is
  'Permanently deletes the calling user from auth.users. All public.* rows referencing this user cascade away. Used by the Settings → Delete account flow (GDPR).';
