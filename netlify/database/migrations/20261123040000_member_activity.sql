-- What signed-in members do on raavanaa.org (SURESH, 23 Nov 2026: "who is online, their activity log").
-- One row per page a signed-in member opens, and per share, pledge, memory page, request, vouch or app install.
-- Only for people signed in to the members sign-in; visitors without an account are never in this table.
-- Admins see it in the team portal (Members). Kept so the team can see who is active; nothing here is ever public.
CREATE TABLE IF NOT EXISTS member_activity (
  id      BIGSERIAL PRIMARY KEY,
  email   TEXT NOT NULL,
  kind    TEXT NOT NULL,                 -- view, share, give, memory, request, vouch, install
  path    TEXT NOT NULL DEFAULT '',
  detail  TEXT NOT NULL DEFAULT '',
  at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS member_activity_email_idx ON member_activity (email, at DESC);
CREATE INDEX IF NOT EXISTS member_activity_at_idx ON member_activity (at DESC);
