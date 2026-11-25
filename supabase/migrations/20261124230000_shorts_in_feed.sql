-- Shorts join the main feed, so they need to be a reactable post kind like the others.
alter type public.feed_post_kind add value if not exists 'short';
