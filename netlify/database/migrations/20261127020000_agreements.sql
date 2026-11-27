-- Organiser agreement, saved against each project (SURESH 27 Nov 2026: "Do this first").
-- One agreement for everyone; each adult in charge signs it on their own phone at /agree?p=<slug>.
--   agreement_people      who must sign for a project (the person in charge, the principal, anyone the team adds),
--                         each with their own link /agree?p=<slug>&t=<token>. Contact is for the team only.
--   agreement_signatures  every signature: from the page, or typed in by the team from an email (source 'email').
--                         Never shown publicly; the project page only shows a tick when one is in.
CREATE TABLE IF NOT EXISTS agreement_people (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT '',
  contact     TEXT NOT NULL DEFAULT '',
  in_charge   BOOLEAN NOT NULL DEFAULT FALSE,
  token       TEXT NOT NULL UNIQUE DEFAULT md5(random()::text || clock_timestamp()::text),
  added_by    TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  asked_at    TIMESTAMPTZ,
  removed     BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS agreement_people_slug_idx ON agreement_people (slug);

CREATE TABLE IF NOT EXISTS agreement_signatures (
  id            SERIAL PRIMARY KEY,
  slug          TEXT NOT NULL,
  person_id     INTEGER REFERENCES agreement_people (id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT '',
  organisation  TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  language      TEXT NOT NULL DEFAULT 'English',
  version       TEXT NOT NULL DEFAULT '',
  source        TEXT NOT NULL DEFAULT 'page',
  added_by      TEXT NOT NULL DEFAULT '',
  signed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hidden        BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS agreement_signatures_slug_idx ON agreement_signatures (slug, signed_at);
