-- Optional public profile fields: location, ministry, website, avatar already exists.

alter table public.profiles
  add column if not exists city text,
  add column if not exists ministry_name text,
  add column if not exists website_url text;

comment on column public.profiles.city is 'Optional city or region shown on the public profile.';
comment on column public.profiles.ministry_name is 'Optional church or ministry name.';
comment on column public.profiles.website_url is 'Optional public website or social profile URL.';
