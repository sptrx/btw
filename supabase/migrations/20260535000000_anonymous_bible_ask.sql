-- IP-bucketed rate limits for anonymous Bible Q&A from BTW (e.g. 3 asks per UTC hour).

create table if not exists public.anonymous_bible_ask_usage (
  ip_hash text not null,
  hour_key text not null,
  ask_count integer not null default 0 check (ask_count >= 0),
  primary key (ip_hash, hour_key)
);

create index if not exists anonymous_bible_ask_usage_hour_idx
  on public.anonymous_bible_ask_usage (hour_key);

alter table public.anonymous_bible_ask_usage enable row level security;

comment on table public.anonymous_bible_ask_usage is
  'Hourly anonymous Bible Q&A counters keyed by hashed client IP (BTW outreach).';

-- Atomic check + increment; callable from the server without exposing rows to clients.
create or replace function public.check_anonymous_bible_ask(
  p_ip_hash text,
  p_limit integer default 3
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hour text;
  v_count integer;
  v_allowed boolean;
begin
  if p_ip_hash is null or length(trim(p_ip_hash)) < 8 then
    return jsonb_build_object('allowed', false, 'error', 'invalid_request');
  end if;

  v_hour := to_char(timezone('utc', now()), 'YYYYMMDDHH24');

  insert into public.anonymous_bible_ask_usage (ip_hash, hour_key, ask_count)
  values (p_ip_hash, v_hour, 0)
  on conflict (ip_hash, hour_key) do nothing;

  select ask_count into v_count
  from public.anonymous_bible_ask_usage
  where ip_hash = p_ip_hash and hour_key = v_hour
  for update;

  if v_count >= p_limit then
    return jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'error', format('You can ask up to %s Bible questions per hour without an account. Create a free account to ask more.', p_limit)
    );
  end if;

  update public.anonymous_bible_ask_usage
  set ask_count = ask_count + 1
  where ip_hash = p_ip_hash and hour_key = v_hour;

  v_allowed := true;
  return jsonb_build_object(
    'allowed', v_allowed,
    'remaining', greatest(0, p_limit - v_count - 1)
  );
end;
$$;

revoke all on function public.check_anonymous_bible_ask(text, integer) from public;
grant execute on function public.check_anonymous_bible_ask(text, integer) to anon, authenticated, service_role;
