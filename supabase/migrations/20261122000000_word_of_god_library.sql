-- Word of God practice, journal notes, notification preferences, and
-- shareable library reads (for public profiles).

-- ---------------------------------------------------------------------------
-- Memorized scriptures (Word of God practice)
-- ---------------------------------------------------------------------------
create table if not exists public.memorized_scripture (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  reference text not null,
  text text not null,
  practiced_on date not null default ((timezone('utc', now()))::date),
  practice_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, reference)
);

create index if not exists memorized_scripture_user_id_idx
  on public.memorized_scripture (user_id, practiced_on desc);

alter table public.memorized_scripture enable row level security;

drop policy if exists "Users manage own memorized scripture" on public.memorized_scripture;
create policy "Users manage own memorized scripture"
  on public.memorized_scripture
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public read when the owner's profile is not private (shareable library).
drop policy if exists "Public can view memorized scripture of open profiles"
  on public.memorized_scripture;
create policy "Public can view memorized scripture of open profiles"
  on public.memorized_scripture
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = user_id
        and coalesce(p.profile_private, false) = false
    )
  );

-- ---------------------------------------------------------------------------
-- Journal / notes
-- ---------------------------------------------------------------------------
create table if not exists public.journal_note (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  body text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_note_user_id_idx
  on public.journal_note (user_id, updated_at desc);

alter table public.journal_note enable row level security;

drop policy if exists "Users manage own journal notes" on public.journal_note;
create policy "Users manage own journal notes"
  on public.journal_note
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Public can view public journal notes" on public.journal_note;
create policy "Public can view public journal notes"
  on public.journal_note
  for select
  using (
    is_public = true
    and exists (
      select 1 from public.profiles p
      where p.id = user_id
        and coalesce(p.profile_private, false) = false
    )
  );

-- ---------------------------------------------------------------------------
-- Notification alert preferences (mobile + future push)
-- ---------------------------------------------------------------------------
create table if not exists public.notification_preference (
  user_id uuid references auth.users on delete cascade primary key,
  prayer_updates boolean not null default true,
  comments boolean not null default true,
  follows boolean not null default true,
  reactions boolean not null default true,
  word_of_god_reminder boolean not null default true,
  channel_updates boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preference enable row level security;

drop policy if exists "Users manage own notification preferences"
  on public.notification_preference;
create policy "Users manage own notification preferences"
  on public.notification_preference
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Shareable library: others can see saved posts of open profiles.
drop policy if exists "Public can view saved content of open profiles"
  on public.saved_content;
create policy "Public can view saved content of open profiles"
  on public.saved_content
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = user_id
        and coalesce(p.profile_private, false) = false
    )
  );
