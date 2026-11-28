-- Family photo albums (SURESH 28 Nov 2026, option C: "a personal code for each family, and we see who opened it").
-- The photos stay in Google Drive (one folder per event, "Family album"); nothing is copied to Netlify.
-- raavanaa.org/photos/<project> asks for the family's own code, then shows that Drive folder through a read-only
-- Google robot account. The Drive link itself is never shown to families.
--   family_albums       one per project: which Drive folder, open or closed, the day it closes by itself.
--   family_album_codes  one code per family (parent's name + WhatsApp). Stop or renew any code at any time.
--   family_album_log    who opened the album, what they downloaded, wrong codes (for the "Who opened it" list).
CREATE TABLE IF NOT EXISTS family_albums (
  slug        TEXT PRIMARY KEY,
  folder_id   TEXT NOT NULL DEFAULT '',
  folder_url  TEXT NOT NULL DEFAULT '',
  is_open     BOOLEAN NOT NULL DEFAULT TRUE,
  closes_on   DATE,
  created_by  TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_album_codes (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL,
  family      TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  code        TEXT NOT NULL,
  created_by  TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stopped_at  TIMESTAMPTZ,
  last_seen   TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS family_album_codes_live_idx ON family_album_codes (slug, code) WHERE stopped_at IS NULL;

CREATE TABLE IF NOT EXISTS family_album_log (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL,
  code_id     INTEGER,
  family      TEXT NOT NULL DEFAULT '',
  action      TEXT NOT NULL,
  detail      TEXT NOT NULL DEFAULT '',
  ip_hash     TEXT NOT NULL DEFAULT '',
  at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS family_album_log_slug_idx ON family_album_log (slug, at DESC);
CREATE INDEX IF NOT EXISTS family_album_log_ip_idx ON family_album_log (ip_hash, at) WHERE action = 'wrong';
