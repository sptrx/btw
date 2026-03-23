-- Optional intro / notes for each channel page (editable in page settings)
alter table public.channel_pages add column if not exists description text;
