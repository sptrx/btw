-- Let signed-in users leave a channel they were walking with
drop policy if exists "Users can leave topic" on public.topic_members;
create policy "Users can leave topic"
  on public.topic_members
  for delete
  using (auth.uid() = user_id);

-- Saved posts for later reference ("Keep")
create table if not exists public.saved_content (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  topic_content_id uuid references public.topic_content on delete cascade not null,
  created_at timestamptz default now() not null,
  unique (user_id, topic_content_id)
);

create index if not exists saved_content_user_id_idx on public.saved_content (user_id, created_at desc);
create index if not exists saved_content_topic_content_id_idx on public.saved_content (topic_content_id);

alter table public.saved_content enable row level security;

drop policy if exists "Users can view own saved content" on public.saved_content;
create policy "Users can view own saved content"
  on public.saved_content
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can save content" on public.saved_content;
create policy "Users can save content"
  on public.saved_content
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unsave content" on public.saved_content;
create policy "Users can unsave content"
  on public.saved_content
  for delete
  using (auth.uid() = user_id);
