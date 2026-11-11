-- Community endorsement (SURESH, 9 Nov 2026): every request gets a private link that the person who sent it shares
-- with people who know the project. They vouch for it, by name. Three endorsements, at least one from someone in a
-- role (principal, teacher, Grama Niladhari, temple, organisation), make a request "community-backed". A Raavanaa
-- Champion (team member) still checks it before it becomes a project that takes money.

ALTER TABLE suggestions ADD COLUMN endorse_token TEXT NOT NULL DEFAULT '';
CREATE INDEX suggestions_endorse_token_idx ON suggestions (endorse_token) WHERE endorse_token <> '';

CREATE TABLE endorsements (
  id             SERIAL PRIMARY KEY,
  suggestion_id  INTEGER NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,                       -- shown publicly
  relation       TEXT NOT NULL CHECK (relation IN ('role', 'know', 'seen')),
  role           TEXT NOT NULL DEFAULT '',            -- e.g. "Principal, the school"; shown publicly
  phone          TEXT NOT NULL,                       -- private: only the team sees it, to call and check
  phone_key      TEXT NOT NULL,                       -- digits only, last 9, so one phone vouches once
  hidden         BOOLEAN NOT NULL DEFAULT FALSE,      -- the team can hide an endorsement that turns out to be false
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (suggestion_id, phone_key)
);
CREATE INDEX endorsements_sid_idx ON endorsements (suggestion_id, created_at);

-- Requests sent before this change get a link too, so the team can share it.
UPDATE suggestions SET endorse_token = substr(md5(random()::text || id::text || clock_timestamp()::text), 1, 12) WHERE endorse_token = '';
