-- Volunteers page (SURESH, 17 Nov 2026: "for now just have all the volunteers under a volunteers page").
-- Everyone who joins through "Join Raavanaa" (/spark) or the Volunteer form (/volunteer) is saved here as well as in
-- Netlify Forms. Only people who tick "Show me on the Volunteers page" are listed, and only their first name with
-- the first letter of the last name, their town and their skills. Phone and email are never shown.
--   member_email  the signed-in member who joined (they get the "Member" badge), or ''
--   show_public   the person agreed to be listed
--   hidden        the team took them off the page (portal: Volunteers)
CREATE TABLE IF NOT EXISTS volunteers (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  contact       TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  city          TEXT NOT NULL DEFAULT '',
  skills        TEXT[] NOT NULL DEFAULT '{}',
  help          TEXT[] NOT NULL DEFAULT '{}',
  availability  TEXT NOT NULL DEFAULT '',
  message       TEXT NOT NULL DEFAULT '',
  source        TEXT NOT NULL DEFAULT '',
  member_email  TEXT NOT NULL DEFAULT '',
  show_public   BOOLEAN NOT NULL DEFAULT FALSE,
  hidden        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS volunteers_public_idx ON volunteers (show_public, hidden, created_at DESC);
-- Champions can choose to be shown too (first name and district only); the team ticks it in the portal.
ALTER TABLE champions ADD COLUMN IF NOT EXISTS show_public BOOLEAN NOT NULL DEFAULT TRUE;
