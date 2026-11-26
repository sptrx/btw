-- Prophecy is already a sharing type in the app. Widen the check so those posts can be saved.
alter table public.topic_content
  drop constraint if exists topic_content_sharing_type_check;

alter table public.topic_content
  add constraint topic_content_sharing_type_check check (
    sharing_type in (
      'testimony',
      'revelation',
      'prophecy',
      'prayer_request',
      'praise_report',
      'question',
      'discussion',
      'devotional'
    )
  );
