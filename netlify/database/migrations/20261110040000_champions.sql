-- Raavanaa Champions (SURESH, 10 Nov 2026): trusted local volunteers who call or visit a request before it can take
-- money. Each has a home district; the team assigns one to a request's visit.
CREATE TABLE IF NOT EXISTS champions (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  district    TEXT NOT NULL DEFAULT '',
  areas       TEXT NOT NULL DEFAULT '',   -- villages or towns they can reach
  note        TEXT NOT NULL DEFAULT '',
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  added_by    TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS champion_id INTEGER REFERENCES champions(id) ON DELETE SET NULL;
