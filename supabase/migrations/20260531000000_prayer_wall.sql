-- Prayer Wall: requests, prayers (reactions), praise reports, encouragement comments

create table if not exists public.prayer_request (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null check (char_length(trim(title)) between 1 and 200),
  body text not null check (char_length(trim(body)) between 1 and 5000),
  is_anonymous boolean not null default false,
  status text not null default 'active' check (status in ('active', 'answered', 'closed')),
  moderation_status text not null default 'approved'
    check (moderation_status in ('approved', 'pending_review', 'rejected')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists prayer_request_status_created_idx
  on public.prayer_request (status, created_at desc);
create index if not exists prayer_request_user_id_idx
  on public.prayer_request (user_id, created_at desc);
create index if not exists prayer_request_moderation_idx
  on public.prayer_request (moderation_status, created_at desc);

comment on table public.prayer_request is 'Community prayer requests on the Prayer Wall.';

create table if not exists public.prayer (
  id uuid default gen_random_uuid() primary key,
  prayer_request_id uuid references public.prayer_request on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now() not null,
  unique (prayer_request_id, user_id)
);

create index if not exists prayer_request_id_idx on public.prayer (prayer_request_id);

create table if not exists public.praise_report (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  prayer_request_id uuid references public.prayer_request on delete set null,
  linked_prayer_id uuid references public.prayer_request on delete set null,
  moderation_status text not null default 'approved'
    check (moderation_status in ('approved', 'pending_review', 'rejected')),
  created_at timestamptz default now() not null
);

create index if not exists praise_report_created_idx
  on public.praise_report (created_at desc);
create index if not exists praise_report_prayer_request_idx
  on public.praise_report (prayer_request_id);

create table if not exists public.prayer_request_comment (
  id uuid default gen_random_uuid() primary key,
  prayer_request_id uuid references public.prayer_request on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz default now() not null
);

create index if not exists prayer_request_comment_request_idx
  on public.prayer_request_comment (prayer_request_id, created_at asc);

-- RLS
alter table public.prayer_request enable row level security;
alter table public.prayer enable row level security;
alter table public.praise_report enable row level security;
alter table public.prayer_request_comment enable row level security;

-- prayer_request: public reads approved; authors see own; authors manage own
drop policy if exists "Prayer requests viewable when approved or own" on public.prayer_request;
create policy "Prayer requests viewable when approved or own"
  on public.prayer_request for select
  using (
    moderation_status = 'approved'
    or auth.uid() = user_id
  );

drop policy if exists "Users can create prayer requests" on public.prayer_request;
create policy "Users can create prayer requests"
  on public.prayer_request for insert
  with check (auth.uid() = user_id);

drop policy if exists "Authors can update own prayer requests" on public.prayer_request;
create policy "Authors can update own prayer requests"
  on public.prayer_request for update
  using (auth.uid() = user_id);

-- prayer: anyone can read counts; users manage own row
drop policy if exists "Prayers viewable by everyone" on public.prayer;
create policy "Prayers viewable by everyone"
  on public.prayer for select using (true);

drop policy if exists "Users can add prayer" on public.prayer;
create policy "Users can add prayer"
  on public.prayer for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove own prayer" on public.prayer;
create policy "Users can remove own prayer"
  on public.prayer for delete using (auth.uid() = user_id);

-- praise_report: public approved; authors insert
drop policy if exists "Praise reports viewable when approved or own" on public.praise_report;
create policy "Praise reports viewable when approved or own"
  on public.praise_report for select
  using (moderation_status = 'approved' or auth.uid() = user_id);

drop policy if exists "Users can create praise reports" on public.praise_report;
create policy "Users can create praise reports"
  on public.praise_report for insert with check (auth.uid() = user_id);

-- comments on prayer requests
drop policy if exists "Prayer comments viewable by everyone" on public.prayer_request_comment;
create policy "Prayer comments viewable by everyone"
  on public.prayer_request_comment for select using (true);

drop policy if exists "Users can add prayer comments" on public.prayer_request_comment;
create policy "Users can add prayer comments"
  on public.prayer_request_comment for insert with check (auth.uid() = user_id);
