-- Site moderator role for content review (assign in Supabase: profiles.role = 'moderator')
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'channel_author', 'moderator'));

comment on column public.profiles.role is
  'user | channel_author | moderator (site-wide content review)';

-- Moderators can update content rows (app limits changes to moderation_status)
drop policy if exists "Moderators can update topic content" on public.topic_content;
create policy "Moderators can update topic content"
  on public.topic_content
  for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'moderator'
    )
  );

-- Moderators can read all user reports
drop policy if exists "Moderators can view all content reports" on public.content_reports;
create policy "Moderators can view all content reports"
  on public.content_reports
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'moderator'
    )
  );
