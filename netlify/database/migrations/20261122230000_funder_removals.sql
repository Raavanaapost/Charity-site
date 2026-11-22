-- Sponsors the team added by hand (projects.json "funders") can be taken off a project from the portal
-- (SURESH, 22 Nov 2026: "There are situations that I need to remove some sponsors ... adjust the percentage").
-- A row here hides that sponsor on the website, so the % bar, "Still needed" and the money page follow.
-- Nothing is deleted from projects.json: "Put back" deletes the row and the sponsor shows again.
CREATE TABLE IF NOT EXISTS funder_removals (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL,
  name        TEXT NOT NULL,
  amount      NUMERIC NOT NULL DEFAULT 0,
  removed_by  TEXT NOT NULL DEFAULT '',
  removed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (slug, name, amount)
);
