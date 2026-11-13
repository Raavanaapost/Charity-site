-- Family circle, stage 1: invite and join (SURESH, 13 Nov 2026).
-- The person who makes a family page (/m/<code>) invites the people they want with them, from their own WhatsApp,
-- texts, Facebook or Instagram. Each invite has its own short code, so the organiser sees who opened it and who joined.
-- People who join show on the page by the name and country they choose. Emails and invite names stay private.

-- Who made the page: a secret key kept on their phone, and their email when they were signed in.
ALTER TABLE moments ADD COLUMN IF NOT EXISTS owner_key TEXT NOT NULL DEFAULT '';
ALTER TABLE moments ADD COLUMN IF NOT EXISTS owner_email TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS moment_invites (
  id            SERIAL PRIMARY KEY,
  moment_code   TEXT NOT NULL,
  ref           TEXT NOT NULL UNIQUE,                 -- the link: /m/<code>?i=<ref>
  label         TEXT NOT NULL DEFAULT '',             -- who it was for, as the organiser typed it (only they see it)
  channel       TEXT NOT NULL DEFAULT 'link',         -- whatsapp, sms, facebook, instagram, link
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at     TIMESTAMPTZ,
  joined_at     TIMESTAMPTZ,
  hidden        BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS moment_invites_code_idx ON moment_invites (moment_code);

CREATE TABLE IF NOT EXISTS moment_members (
  id            SERIAL PRIMARY KEY,
  moment_code   TEXT NOT NULL,
  email         TEXT NOT NULL,                        -- private, from the members sign-in
  display_name  TEXT NOT NULL,                        -- what the circle sees
  country       TEXT NOT NULL DEFAULT '',
  invite_ref    TEXT NOT NULL DEFAULT '',
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hidden        BOOLEAN NOT NULL DEFAULT FALSE,       -- the organiser or the team can take a name down
  UNIQUE (moment_code, email)
);
CREATE INDEX IF NOT EXISTS moment_members_code_idx ON moment_members (moment_code);
