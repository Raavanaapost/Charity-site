-- "A moment in their name", given together (SURESH, 10 Nov 2026).
-- A giver can make a page for the person they are remembering or celebrating (/m/<code>) and share it, so family
-- and friends give to the same moment. Gifts made from that page carry its code. The name is the person remembered
-- or celebrated (or the family or group giving), never a child's.
CREATE TABLE IF NOT EXISTS moments (
  id            SERIAL PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,                 -- the link: /m/<code>
  kind          TEXT NOT NULL,                        -- memory, birthday, wedding, behalf, custom...
  words         TEXT NOT NULL DEFAULT '',             -- "In loving memory of", or the giver's own words
  name          TEXT NOT NULL,
  note          TEXT NOT NULL DEFAULT '',
  from_name     TEXT NOT NULL DEFAULT '',
  project_slug  TEXT NOT NULL DEFAULT '',             -- '' = the Raavanaa Fund
  wish          TEXT NOT NULL DEFAULT '',             -- the giver's own wish, when they have one
  day           DATE,                                 -- their day (a birthday, a remembrance day), when given
  lang          TEXT NOT NULL DEFAULT 'en',
  hidden        BOOLEAN NOT NULL DEFAULT FALSE,       -- the team can take a page down
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Which family page a gift came from, the giver's own wish, and their yearly reminder.
ALTER TABLE give_orders ADD COLUMN IF NOT EXISTS moment_code TEXT NOT NULL DEFAULT '';
ALTER TABLE give_orders ADD COLUMN IF NOT EXISTS wish TEXT NOT NULL DEFAULT '';
ALTER TABLE give_orders ADD COLUMN IF NOT EXISTS remind JSONB;      -- {"every":"year","day":"2026-11-27","phone":"..."}
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS moment_code TEXT NOT NULL DEFAULT '';
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS wish TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS gifts_moment_code_idx ON gifts (moment_code) WHERE moment_code <> '';

-- "Make it a moment every year": the giver asked to be reminded before their day. Sending the reminders needs an
-- email or WhatsApp service, which is still to be chosen; until then the team can see the list here.
CREATE TABLE IF NOT EXISTS moment_reminders (
  id            SERIAL PRIMARY KEY,
  order_id      TEXT NOT NULL UNIQUE,
  moment_code   TEXT NOT NULL DEFAULT '',
  kind          TEXT NOT NULL DEFAULT '',
  words         TEXT NOT NULL DEFAULT '',
  name          TEXT NOT NULL DEFAULT '',             -- the person remembered or celebrated
  day           DATE NOT NULL,                        -- remind before this day, every year
  email         TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  lang          TEXT NOT NULL DEFAULT 'en',
  project_slug  TEXT NOT NULL DEFAULT '',
  last_sent     DATE,
  stopped       BOOLEAN NOT NULL DEFAULT FALSE,
  livemode      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
