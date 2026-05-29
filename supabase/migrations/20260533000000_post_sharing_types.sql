-- Structured post sharing types (semantic category separate from media format `type`)

alter table public.topic_content
  add column if not exists sharing_type text,
  add column if not exists scripture_reference text;

comment on column public.topic_content.sharing_type is
  'What the author is sharing: testimony, revelation, prayer_request, praise_report, question, discussion, devotional';
comment on column public.topic_content.scripture_reference is
  'Scripture reference for devotional posts (e.g. Psalm 23:1)';

-- Backfill from existing media type
update public.topic_content
set sharing_type = 'discussion'
where sharing_type is null and type = 'discussion';

-- Backfill from topic tags
update public.topic_content tc
set sharing_type = 'testimony'
from public.post_tags pt
join public.topic_tags tt on tt.id = pt.tag_id
where pt.topic_content_id = tc.id
  and tt.slug = 'testimonies'
  and tc.sharing_type is null;

update public.topic_content tc
set sharing_type = 'revelation'
from public.post_tags pt
join public.topic_tags tt on tt.id = pt.tag_id
where pt.topic_content_id = tc.id
  and tt.slug = 'revelation'
  and tc.sharing_type is null;

-- Default remaining to testimony (historical default experience)
update public.topic_content
set sharing_type = 'testimony'
where sharing_type is null;

alter table public.topic_content
  alter column sharing_type set default 'testimony',
  alter column sharing_type set not null;

alter table public.topic_content
  drop constraint if exists topic_content_sharing_type_check;

alter table public.topic_content
  add constraint topic_content_sharing_type_check check (
    sharing_type in (
      'testimony',
      'revelation',
      'prayer_request',
      'praise_report',
      'question',
      'discussion',
      'devotional'
    )
  );
