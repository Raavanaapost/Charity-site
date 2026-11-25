-- Followers and project updates (SURESH, 25 Nov 2026: "we need the people who sponsored to check to follow option.
-- Then each update related to them will be going to them. Its better in whatsup."). Option A: free, WhatsApp by tap.
--   project_follows   one row per person per project: WhatsApp number or email (team only, never public), from the
--                     Follow box on the project page, from the Follow tick on the Be the smile form, or added by hand
--                     in the portal. token = their own "stop updates" link. stopped_at set = no more updates.
--   project_updates   news the team posts in the portal (Followers & updates); shows on the project page at once.
--   update_sends      who has been sent which update (the team taps WhatsApp/Email, then it is ticked).
CREATE TABLE IF NOT EXISTS project_follows (
  id           SERIAL PRIMARY KEY,
  slug         TEXT NOT NULL,
  name         TEXT NOT NULL DEFAULT '',
  contact      TEXT NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('whatsapp', 'email')),
  contact_key  TEXT NOT NULL,
  source       TEXT NOT NULL DEFAULT 'page',
  token        TEXT NOT NULL UNIQUE DEFAULT md5(random()::text || clock_timestamp()::text),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stopped_at   TIMESTAMPTZ,
  UNIQUE (slug, contact_key)
);
CREATE INDEX IF NOT EXISTS project_follows_slug_idx ON project_follows (slug, created_at);

CREATE TABLE IF NOT EXISTS project_updates (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  posted_by   TEXT NOT NULL DEFAULT '',
  hidden      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS project_updates_slug_idx ON project_updates (slug, created_at DESC);

CREATE TABLE IF NOT EXISTS update_sends (
  update_id   INTEGER NOT NULL REFERENCES project_updates (id) ON DELETE CASCADE,
  follow_id   INTEGER NOT NULL REFERENCES project_follows (id) ON DELETE CASCADE,
  sent_by     TEXT NOT NULL DEFAULT '',
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (update_id, follow_id)
);

-- Givers who already ticked Follow on the Be the smile form become followers of that project.
INSERT INTO project_follows (slug, name, contact, kind, contact_key, source, created_at)
SELECT DISTINCT ON (g.project_slug, k.key) g.project_slug, g.name, g.contact,
       CASE WHEN g.contact LIKE '%@%' THEN 'email' ELSE 'whatsapp' END, k.key, 'give', g.received_at
FROM give_requests g,
     LATERAL (SELECT CASE WHEN g.contact LIKE '%@%' THEN lower(trim(g.contact))
                          ELSE regexp_replace(regexp_replace(g.contact, '\D', '', 'g'), '^0(7\d{8})$', '94\1') END AS key) k
WHERE g.follow AND g.project_slug IS NOT NULL AND g.project_slug <> '' AND g.status <> 'closed' AND k.key <> ''
ORDER BY g.project_slug, k.key, g.received_at
ON CONFLICT (slug, contact_key) DO NOTHING;
