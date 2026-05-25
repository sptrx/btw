-- Moderation status on published content (approved | pending_review | rejected)
alter table public.topic_content
  add column if not exists moderation_status text not null default 'approved';

alter table public.topic_content drop constraint if exists topic_content_moderation_status_check;
alter table public.topic_content add constraint topic_content_moderation_status_check
  check (moderation_status in ('approved', 'pending_review', 'rejected'));

create index if not exists topic_content_moderation_status_idx
  on public.topic_content (moderation_status, created_at desc);

comment on column public.topic_content.moderation_status is
  'Public surfaces show approved only. pending_review = AI/human queue; rejected = hidden.';

-- User reports on posts and comments
create table if not exists public.content_reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references auth.users on delete cascade not null,
  topic_content_id uuid references public.topic_content on delete cascade not null,
  comment_id uuid references public.topic_content_comments on delete cascade,
  reason text not null check (reason in ('off_mission', 'political', 'harassment', 'spam', 'other')),
  details text,
  created_at timestamptz default now() not null,
  check (char_length(trim(details)) <= 2000 or details is null)
);

create index if not exists content_reports_content_id_idx on public.content_reports (topic_content_id);
create index if not exists content_reports_reporter_id_idx on public.content_reports (reporter_id, created_at desc);

alter table public.content_reports enable row level security;

drop policy if exists "Users can insert own reports" on public.content_reports;
create policy "Users can insert own reports"
  on public.content_reports
  for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Users can view own reports" on public.content_reports;
create policy "Users can view own reports"
  on public.content_reports
  for select
  using (auth.uid() = reporter_id);
