-- Add optional banner image to channels (a.k.a. public.topics).
-- Used by /channel/browse cards. Nullable text, no default; no backfill.
-- RLS already in place on public.topics covers this column (no per-column policies).

alter table public.topics
  add column if not exists banner_image_url text;
