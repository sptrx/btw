-- Optional AI "Scripture guide" reply stored on each comment (filled by BTW server after calling bible-ai).

alter table public.topic_content_comments
  add column if not exists scripture_guide_reply text;

comment on column public.topic_content_comments.scripture_guide_reply is
  'Optional Scripture Chat (bible-ai) guide reply; written by server after comment insert.';

drop policy if exists "Users can update own comments" on public.topic_content_comments;
create policy "Users can update own comments" on public.topic_content_comments
  for update using (auth.uid() = user_id);
