-- Author feedback when a moderator rejects a post
alter table public.topic_content
  add column if not exists moderation_note text;

alter table public.topic_content drop constraint if exists topic_content_moderation_note_len;
alter table public.topic_content add constraint topic_content_moderation_note_len
  check (moderation_note is null or char_length(trim(moderation_note)) <= 1000);

comment on column public.topic_content.moderation_note is
  'Optional note from a moderator when moderation_status is rejected; shown to the author only.';

-- In-app notification when moderation rejects a post
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('comment', 'like', 'moderation_rejected'));

alter table public.notifications
  add column if not exists detail text;

alter table public.notifications drop constraint if exists notifications_detail_len;
alter table public.notifications add constraint notifications_detail_len
  check (detail is null or char_length(trim(detail)) <= 1000);
