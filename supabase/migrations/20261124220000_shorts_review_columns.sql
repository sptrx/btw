-- Who reviewed a short and when, so moderators can see the full history.
alter table public.shorts
  add column if not exists reviewed_by uuid references auth.users on delete set null,
  add column if not exists reviewed_at timestamptz;

create index if not exists shorts_status_idx on public.shorts (status, created_at desc);

create or replace function public.shorts_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user = 'service_role' or public.is_site_moderator() then
    return new;
  end if;
  if new.author_id is distinct from old.author_id
     or new.approved_at is distinct from old.approved_at
     or new.rejection_reason is distinct from old.rejection_reason
     or new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at
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
