-- Public contact form submissions (insert-only for visitors; moderators can read in dashboard/SQL later)
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 1),
  email text not null check (char_length(trim(email)) >= 3),
  subject text,
  message text not null check (char_length(trim(message)) >= 10),
  created_at timestamptz not null default now()
);

comment on table public.contact_submissions is 'Messages from the public Contact us form';

alter table public.contact_submissions enable row level security;

drop policy if exists "Anyone can submit contact form" on public.contact_submissions;
create policy "Anyone can submit contact form"
  on public.contact_submissions
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Moderators can read contact submissions" on public.contact_submissions;
create policy "Moderators can read contact submissions"
  on public.contact_submissions
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'moderator'
    )
  );
