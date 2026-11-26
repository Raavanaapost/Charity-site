-- Associates (SURESH 26 Nov 2026, "Medium"): who runs a Raavanaa project (owner) and who works together with them
-- (partner); a group's own project the team chose to show in the main Raavanaa list, with its category; and the
-- organiser agreement the team saw signed (one step of the associate ladder).
ALTER TABLE group_projects ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'owner';
ALTER TABLE group_projects ADD COLUMN IF NOT EXISTS on_raavanaa BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE group_projects ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT '';
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS agreed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS agreed_at TIMESTAMPTZ;
