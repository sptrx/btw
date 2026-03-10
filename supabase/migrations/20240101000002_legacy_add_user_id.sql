-- Run this ONLY if you have an existing posts table without user_id (from older setup).
-- For fresh installs, use 20240101000001_initial_schema.sql only.

-- Create profiles + trigger if not exists
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  post_count int default 0,
  last_post_at timestamptz
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS on profiles if not already
alter table public.profiles enable row level security;
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Add user_id to posts if column doesn't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'posts') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'posts' and column_name = 'user_id') then
      alter table public.posts add column user_id uuid references auth.users on delete set null;
    end if;
  end if;
end $$;
