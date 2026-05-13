-- Persist the user's first acceptance of the content submission disclaimer.
--
-- Today every comment / post submission re-prompts the disclaimer checkbox,
-- which adds per-action friction. We record the timestamp of the first
-- acceptance on the profile so subsequent submissions auto-pass without
-- re-prompting (the UI hides the checkbox once this is set).
--
-- Stored as `timestamptz` instead of a boolean so we have an audit trail of
-- *when* the user agreed -- useful for legal / dispute purposes. A NULL
-- value means the user has not yet agreed (treated identically to the
-- prior behavior: prompt them).

alter table public.profiles
  add column if not exists content_disclaimer_accepted_at timestamptz;
