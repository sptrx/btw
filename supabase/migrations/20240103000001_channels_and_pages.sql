-- Channel-based structure: domain/channel-name with sub-pages
-- 1. User role for signup (channel_author vs user)
alter table public.profiles add column if not exists role text default 'user';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('user', 'channel_author'));

-- Update trigger to set role from signup metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Channel pages (sub-pages under each channel)
create table if not exists public.channel_pages (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references public.topics on delete cascade not null,
  slug text not null,
  title text not null,
  sort_order int default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(channel_id, slug)
);

create index if not exists channel_pages_channel_id_idx on public.channel_pages (channel_id);

-- Create default "home" page for each existing channel
insert into public.channel_pages (channel_id, slug, title, sort_order)
select id, 'home', 'Home', 0 from public.topics
on conflict (channel_id, slug) do nothing;

-- 3. Add page_id to topic_content
alter table public.topic_content add column if not exists page_id uuid references public.channel_pages on delete set null;

-- Migrate content types before altering constraint
update public.topic_content set type = 'article' where type in ('tutorial', 'image');
update public.topic_content set type = 'discussion' where type = 'debate';

-- Update type constraint
alter table public.topic_content drop constraint if exists topic_content_type_check;
alter table public.topic_content add constraint topic_content_type_check 
  check (type in ('video', 'podcast', 'article', 'discussion'));

-- Set page_id for existing content (link to channel's home page)
update public.topic_content tc
set page_id = (select id from public.channel_pages cp where cp.channel_id = tc.topic_id and cp.slug = 'home' limit 1)
where page_id is null;

-- 4. RLS for channel_pages
alter table public.channel_pages enable row level security;
drop policy if exists "Channel pages viewable by everyone" on public.channel_pages;
create policy "Channel pages viewable by everyone" on public.channel_pages for select using (true);
drop policy if exists "Channel authors can create pages" on public.channel_pages;
create policy "Channel authors can create pages" on public.channel_pages for insert with check (
  exists (select 1 from public.topics t where t.id = channel_id and t.author_id = auth.uid())
);
drop policy if exists "Channel authors can update pages" on public.channel_pages;
create policy "Channel authors can update pages" on public.channel_pages for update using (
  exists (select 1 from public.topics t where t.id = channel_id and t.author_id = auth.uid())
);
drop policy if exists "Channel authors can delete pages" on public.channel_pages;
create policy "Channel authors can delete pages" on public.channel_pages for delete using (
  exists (select 1 from public.topics t where t.id = channel_id and t.author_id = auth.uid())
);
