-- Community groups (SURESH, 23 Nov 2026): "We have small groups that collect money through their WhatsApp circle and
-- coordinate and do projects. Allow them to integrate with us: create profiles for them and follow their projects."
-- A group registers itself (signed in), the team checks it and lists it, and its page is /g/<slug>.
-- A group's money stays in its own circle: Raavanaa never holds it. What a group types about its money is shown as
-- "reported by the group".
--   status         waiting (new, only the group's own admins see the page) | listed (public) | hidden (taken off)
--   checked        the team called or met the group (shows "Checked by Raavanaa")
--   owner_email    the signed-in account that registered the group; admins = more accounts that can manage it
--   contact_*      private: only the team and the group's admins see them
CREATE TABLE IF NOT EXISTS community_groups (
  id             SERIAL PRIMARY KEY,
  slug           TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  kind           TEXT NOT NULL DEFAULT '',
  about          TEXT NOT NULL DEFAULT '',
  places         TEXT NOT NULL DEFAULT '',
  members_count  INTEGER NOT NULL DEFAULT 0,
  started        TEXT NOT NULL DEFAULT '',
  collect        TEXT NOT NULL DEFAULT '',
  contact_name   TEXT NOT NULL DEFAULT '',
  contact_phone  TEXT NOT NULL DEFAULT '',
  owner_email    TEXT NOT NULL,
  admins         TEXT[] NOT NULL DEFAULT '{}',
  status         TEXT NOT NULL DEFAULT 'waiting',
  checked        BOOLEAN NOT NULL DEFAULT FALSE,
  team_note      TEXT NOT NULL DEFAULT '',
  listed_by      TEXT NOT NULL DEFAULT '',
  listed_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS community_groups_status_idx ON community_groups (status, created_at DESC);
CREATE INDEX IF NOT EXISTS community_groups_owner_idx ON community_groups (owner_email);

-- People who follow a group (signed-in accounts). Shown as a count; the list is private.
CREATE TABLE IF NOT EXISTS group_follows (
  group_id    INTEGER NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, email)
);
CREATE INDEX IF NOT EXISTS group_follows_email_idx ON group_follows (email);

-- A group's projects. Two kinds:
--   raavanaa_slug set   a raavanaa.org project the group started or backs (linked by the team in the portal)
--   raavanaa_slug ''    a project the group runs in its own circle, typed in by the group (stage, cost, collected)
CREATE TABLE IF NOT EXISTS group_projects (
  id             SERIAL PRIMARY KEY,
  group_id       INTEGER NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  raavanaa_slug  TEXT NOT NULL DEFAULT '',
  title          TEXT NOT NULL DEFAULT '',
  place          TEXT NOT NULL DEFAULT '',
  stage          TEXT NOT NULL DEFAULT 'Initiated',
  story          TEXT NOT NULL DEFAULT '',
  day            TEXT NOT NULL DEFAULT '',
  cost           NUMERIC NOT NULL DEFAULT 0,
  collected      NUMERIC NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'LKR',
  hidden         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS group_projects_group_idx ON group_projects (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS group_projects_slug_idx ON group_projects (raavanaa_slug);

-- Short news from the group ("We collected 40,000 this week", "The day is fixed for 6 Dec"). Followers see them on
-- the group page and in My account. The team can hide one.
CREATE TABLE IF NOT EXISTS group_updates (
  id          SERIAL PRIMARY KEY,
  group_id    INTEGER NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  project_id  INTEGER REFERENCES group_projects(id) ON DELETE SET NULL,
  body        TEXT NOT NULL,
  by_name     TEXT NOT NULL DEFAULT '',
  by_email    TEXT NOT NULL DEFAULT '',
  hidden      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS group_updates_group_idx ON group_updates (group_id, created_at DESC);
