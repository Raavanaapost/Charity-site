-- The project day, live (SURESH 26 Nov 2026, Kandy trip: "make the two sponsors have the feeling of the project as it progresses").
--   project_updates.image / kind / amount
--                 an update can carry one photo (Netlify Blobs key) and be a 'live' post from the day, or a 'receipt'
--                 (item + amount + photo of the bill) that joins the project's money page instead of the news.
--   day_links     private phone links (/day/<token>) the team gives the organiser on the bus: post a photo and a line
--                 straight to the project page, no sign-in. The team can stop a link at any time.
--   sponsor_thanks one private thank-you page per sponsor (/thanks/<token>), from the children and the school,
--                 addressed to that sponsor by name. Never listed anywhere; the team sends the link to the sponsor.
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS image TEXT NOT NULL DEFAULT '';
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'news';
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS day_links (
  token       TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
  slug        TEXT NOT NULL,
  label       TEXT NOT NULL DEFAULT '',
  created_by  TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stopped_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sponsor_thanks (
  token       TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
  slug        TEXT NOT NULL,
  give_ref    TEXT NOT NULL DEFAULT '',
  to_name     TEXT NOT NULL,
  message     TEXT NOT NULL DEFAULT '',
  from_line   TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT '',
  letter      TEXT NOT NULL DEFAULT '',
  video       TEXT NOT NULL DEFAULT '',
  created_by  TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at   TIMESTAMPTZ,
  hidden      BOOLEAN NOT NULL DEFAULT FALSE
);
