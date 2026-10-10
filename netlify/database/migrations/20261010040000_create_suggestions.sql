-- Team portal, step 1: suggestions sent through the Initiate form, the team's notes, and a log of every change.

CREATE TABLE suggestions (
  id            SERIAL PRIMARY KEY,
  ref           TEXT UNIQUE NOT NULL,              -- shown to the team, e.g. S-1001
  received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT NOT NULL DEFAULT 'new'        -- new | visit | verified | declined | project
                CHECK (status IN ('new', 'visit', 'verified', 'declined', 'project')),
  assigned      TEXT NOT NULL DEFAULT '',
  visit_date    DATE,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT '',
  focus         TEXT[] NOT NULL DEFAULT '{}',
  description   TEXT NOT NULL,
  location      TEXT NOT NULL DEFAULT '',
  children      TEXT NOT NULL DEFAULT '',
  contact       TEXT NOT NULL DEFAULT '',
  reach         TEXT NOT NULL DEFAULT '',
  trusted       TEXT NOT NULL DEFAULT '',
  additional    TEXT NOT NULL DEFAULT '',
  onboard       JSONB NOT NULL DEFAULT '{}'::jsonb, -- visit checklist: explained, showed, safety, test, contact, trusted
  project_slug  TEXT NOT NULL DEFAULT '',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE SEQUENCE suggestion_ref_seq START 1001;
CREATE INDEX suggestions_status_idx ON suggestions (status, received_at DESC);

CREATE TABLE suggestion_notes (
  id             SERIAL PRIMARY KEY,
  suggestion_id  INTEGER NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  by_email       TEXT NOT NULL DEFAULT '',
  by_name        TEXT NOT NULL DEFAULT '',
  body           TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX suggestion_notes_sid_idx ON suggestion_notes (suggestion_id, created_at);

CREATE TABLE audit_log (
  id       SERIAL PRIMARY KEY,
  at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor    TEXT NOT NULL DEFAULT '',
  action   TEXT NOT NULL,
  target   TEXT NOT NULL DEFAULT '',
  details  JSONB NOT NULL DEFAULT '{}'::jsonb
);
