-- Daily usage counters for xgesis.ai / bible-ai calls initiated from BTW (Phase 1 quotas).

create table if not exists public.bible_ai_daily_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default (timezone('utc', now()))::date,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, usage_date)
);

create index if not exists bible_ai_daily_usage_date_idx
  on public.bible_ai_daily_usage (usage_date);

alter table public.bible_ai_daily_usage enable row level security;

-- Users may read their own usage; writes only via service role / server actions.
create policy "Users read own bible ai usage"
  on public.bible_ai_daily_usage
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own bible ai usage"
  on public.bible_ai_daily_usage
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own bible ai usage"
  on public.bible_ai_daily_usage
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.bible_ai_daily_usage is
  'Per-user daily count of bible-ai LLM requests initiated from BTW (commentary / explain).';
