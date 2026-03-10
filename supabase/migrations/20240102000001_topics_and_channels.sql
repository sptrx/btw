-- Topics (author channels)
create table if not exists public.topics (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references auth.users on delete cascade not null,
  title text not null,
  slug text not null unique,
  description text,
  cover_image_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index topics_author_id_idx on public.topics (author_id);
create index topics_slug_idx on public.topics (slug);

-- Topic content: articles, tutorials, debates, images, videos
create table if not exists public.topic_content (
  id uuid default gen_random_uuid() primary key,
  topic_id uuid references public.topics on delete cascade not null,
  author_id uuid references auth.users on delete cascade not null,
  type text not null check (type in ('article', 'tutorial', 'debate', 'image', 'video')),
  title text not null,
  body text,
  media_urls jsonb default '[]',  -- [{url, type, caption}]
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index topic_content_topic_id_idx on public.topic_content (topic_id);
create index topic_content_author_id_idx on public.topic_content (author_id);
create index topic_content_created_at_idx on public.topic_content (created_at desc);

-- Topic members: join requests and approved members
create table if not exists public.topic_members (
  id uuid default gen_random_uuid() primary key,
  topic_id uuid references public.topics on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz default now() not null,
  approved_at timestamptz,
  approved_by uuid references auth.users on delete set null,
  unique(topic_id, user_id)
);

create index topic_members_topic_id_idx on public.topic_members (topic_id);
create index topic_members_user_id_idx on public.topic_members (user_id);

-- Topic content comments (only approved members can add)
create table if not exists public.topic_content_comments (
  id uuid default gen_random_uuid() primary key,
  topic_content_id uuid references public.topic_content on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  body text not null,
  created_at timestamptz default now() not null
);

create index topic_content_comments_content_id_idx on public.topic_content_comments (topic_content_id);

-- Topic content feedback (likes, helpful)
create table if not exists public.topic_content_feedback (
  id uuid default gen_random_uuid() primary key,
  topic_content_id uuid references public.topic_content on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  type text not null check (type in ('like', 'helpful')),
  created_at timestamptz default now() not null,
  unique(topic_content_id, user_id, type)
);

create index topic_content_feedback_content_id_idx on public.topic_content_feedback (topic_content_id);

-- Topic content shares (approved members only)
create table if not exists public.topic_content_shares (
  id uuid default gen_random_uuid() primary key,
  topic_content_id uuid references public.topic_content on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  shared_at timestamptz default now() not null
);

create index topic_content_shares_content_id_idx on public.topic_content_shares (topic_content_id);

-- RLS
alter table public.topics enable row level security;
alter table public.topic_content enable row level security;
alter table public.topic_members enable row level security;
alter table public.topic_content_comments enable row level security;
alter table public.topic_content_feedback enable row level security;
alter table public.topic_content_shares enable row level security;

-- Topics: anyone can read, only author can insert/update/delete
create policy "Topics are viewable by everyone" on public.topics for select using (true);
create policy "Authors can create topics" on public.topics for insert with check (auth.uid() = author_id);
create policy "Authors can update own topics" on public.topics for update using (auth.uid() = author_id);
create policy "Authors can delete own topics" on public.topics for delete using (auth.uid() = author_id);

-- Topic content: anyone can read, only topic author can manage
create policy "Topic content is viewable by everyone" on public.topic_content for select using (true);
create policy "Authors can create topic content" on public.topic_content for insert with check (auth.uid() = author_id);
create policy "Authors can update own topic content" on public.topic_content for update using (auth.uid() = author_id);
create policy "Authors can delete own topic content" on public.topic_content for delete using (auth.uid() = author_id);

-- Topic members: author can manage, users can see own status
create policy "Topic members viewable by authenticated" on public.topic_members for select using (auth.uid() is not null);
create policy "Users can request to join" on public.topic_members for insert with check (auth.uid() = user_id);
create policy "Authors can update member status" on public.topic_members for update using (
  exists (select 1 from public.topics t where t.id = topic_id and t.author_id = auth.uid())
);

-- Comments: approved members only (enforced in app - RLS allows insert for authenticated; we check membership in action)
create policy "Comments viewable by everyone" on public.topic_content_comments for select using (true);
create policy "Authenticated can comment" on public.topic_content_comments for insert with check (auth.uid() = user_id);

-- Feedback: approved members only (enforced in app)
create policy "Feedback viewable by everyone" on public.topic_content_feedback for select using (true);
create policy "Authenticated can give feedback" on public.topic_content_feedback for insert with check (auth.uid() = user_id);

-- Shares: approved members only (enforced in app)
create policy "Shares viewable by everyone" on public.topic_content_shares for select using (true);
create policy "Authenticated can share" on public.topic_content_shares for insert with check (auth.uid() = user_id);
