-- Event-day materials (SURESH 27 Nov 2026: "automate this so I don't have to do much as the event happens").
-- Organisers send photos, videos, voice notes, bills and documents to the one Raavanaa WhatsApp number (or through
-- their phone link for the day, or their private album link). Everything lands here, filed under its project by the
-- sender's phone (People in charge). Nothing is public until a team member ticks it in the portal (Today's materials).
--   event_materials  one row per item. store + blob = where the file is (Netlify Blobs "materials" or "day").
--                    status: new | waiting (sender must pick a project) | unknown (phone not on any project)
--                            | set_aside (blurry, dark, duplicate) | published | bill_added | hidden
--                    ai: what the checks found (quality, child face, receipt fields, transcript), team-only.
--   album_links      private album links (/album/<token>) for the school and organisers. Never public, never sponsors.
--   wa_senders       the project a phone is sending for today (when they run more than one), and when we last replied.
--   wa_seen          WhatsApp message ids already taken in (Meta can send the same message twice).
CREATE TABLE IF NOT EXISTS event_materials (
  id           SERIAL PRIMARY KEY,
  slug         TEXT NOT NULL DEFAULT '',
  source       TEXT NOT NULL DEFAULT 'whatsapp',
  sender       TEXT NOT NULL DEFAULT '',
  sender_name  TEXT NOT NULL DEFAULT '',
  kind         TEXT NOT NULL DEFAULT 'photo',
  mime         TEXT NOT NULL DEFAULT '',
  size         INTEGER NOT NULL DEFAULT 0,
  name         TEXT NOT NULL DEFAULT '',
  store        TEXT NOT NULL DEFAULT 'materials',
  blob         TEXT NOT NULL DEFAULT '',
  wa_media_id  TEXT NOT NULL DEFAULT '',
  caption      TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'new',
  reason       TEXT NOT NULL DEFAULT '',
  sharp        REAL NOT NULL DEFAULT 0,
  bright       REAL NOT NULL DEFAULT 0,
  dhash        TEXT NOT NULL DEFAULT '',
  ai           JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_status    TEXT NOT NULL DEFAULT '',
  ai_error     TEXT NOT NULL DEFAULT '',
  update_id    INTEGER,
  decided_by   TEXT NOT NULL DEFAULT '',
  decided_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS event_materials_slug_idx ON event_materials (slug, created_at);
CREATE INDEX IF NOT EXISTS event_materials_queue_idx ON event_materials (ai_status) WHERE ai_status IN ('queued', 'fetch');

CREATE TABLE IF NOT EXISTS album_links (
  token       TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
  slug        TEXT NOT NULL,
  label       TEXT NOT NULL DEFAULT '',
  created_by  TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stopped_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS wa_senders (
  phone       TEXT PRIMARY KEY,
  slug        TEXT NOT NULL DEFAULT '',
  chosen_on   DATE,
  asked_at    TIMESTAMPTZ,
  acked_at    TIMESTAMPTZ,
  unknown_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS wa_seen (
  id          TEXT PRIMARY KEY,
  at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
