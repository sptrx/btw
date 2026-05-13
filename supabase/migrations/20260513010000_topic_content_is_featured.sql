-- Add `is_featured` flag to `topic_content` to power the homepage Featured strip.
-- Existing UPDATE policy on public.topic_content already restricts writes to the
-- author (`auth.uid() = author_id`), so authors can set this column without any
-- new RLS rules. SELECT is already public, which is what we want for surfacing
-- featured posts in the public feed.

alter table public.topic_content
  add column if not exists is_featured boolean not null default false;

create index if not exists topic_content_is_featured_idx
  on public.topic_content (is_featured)
  where is_featured = true;
