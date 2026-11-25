-- Personal Bible verse bookmarks. Scripture memory uses memorized_scripture.

create table if not exists public.bible_bookmark (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  translation_id text not null default 'kjv',
  book_abbrev text not null,
  book_title text not null,
  chapter integer not null check (chapter > 0),
  verse integer not null check (verse > 0),
  reference text not null,
  verse_text text not null,
  created_at timestamptz not null default now(),
  unique (user_id, translation_id, book_abbrev, chapter, verse)
);

create index if not exists bible_bookmark_user_idx
  on public.bible_bookmark (user_id, created_at desc);

alter table public.bible_bookmark enable row level security;

drop policy if exists "Users read own bible bookmarks" on public.bible_bookmark;
create policy "Users read own bible bookmarks"
  on public.bible_bookmark
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own bible bookmarks" on public.bible_bookmark;
create policy "Users insert own bible bookmarks"
  on public.bible_bookmark
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own bible bookmarks" on public.bible_bookmark;
create policy "Users delete own bible bookmarks"
  on public.bible_bookmark
  for delete
  using (auth.uid() = user_id);
