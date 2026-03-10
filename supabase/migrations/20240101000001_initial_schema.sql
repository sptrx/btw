-- BTW: Christian faith-based social platform
-- Profiles linked to auth.users
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

-- Posts with user ownership
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  text text not null,
  likes int default 0,
  reposts int default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes for performance
create index posts_user_id_idx on public.posts (user_id);
create index posts_created_at_idx on public.posts (created_at desc);

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Posts: anyone can read, only owner can insert/update/delete
create policy "Posts are viewable by everyone"
  on public.posts for select using (true);

create policy "Users can insert own posts"
  on public.posts for insert with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on public.posts for update using (auth.uid() = user_id);

create policy "Users can delete own posts"
  on public.posts for delete using (auth.uid() = user_id);
