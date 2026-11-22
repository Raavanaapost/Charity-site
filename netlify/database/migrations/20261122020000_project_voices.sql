-- Vouches and star ratings on project pages (SURESH, 22 Nov 2026: "Let it vouched as much as people possible.
-- Anybody can vouch it." and "We need a feed back or comment and star rating. So that it can be more authentic and
-- who responsible will take it as serious and care.").
--   kind 'vouch'   "I know this is real": name and how they know are shown at once.
--   kind 'rating'  1 to 5 stars count at once; written words show only after the team has read them (comment_ok),
--                  so no child's name or phone number slips onto a public page.
-- One phone gives one vouch and one rating per project (a new rating from the same phone replaces the old one).
-- Phone numbers are for the team only. The team can hide anything that turns out to be false or unkind.
CREATE TABLE IF NOT EXISTS project_voices (
  id            SERIAL PRIMARY KEY,
  slug          TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('vouch', 'rating')),
  name          TEXT NOT NULL,
  relation      TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL DEFAULT '',
  stars         SMALLINT CHECK (stars BETWEEN 1 AND 5),
  comment       TEXT NOT NULL DEFAULT '',
  comment_ok    BOOLEAN NOT NULL DEFAULT FALSE,
  phone         TEXT NOT NULL DEFAULT '',
  phone_key     TEXT NOT NULL,
  member_email  TEXT NOT NULL DEFAULT '',
  hidden        BOOLEAN NOT NULL DEFAULT FALSE,
  checked_by    TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (slug, kind, phone_key)
);
CREATE INDEX IF NOT EXISTS project_voices_slug_idx ON project_voices (slug, kind, created_at);
