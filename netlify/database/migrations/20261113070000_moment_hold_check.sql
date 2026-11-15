-- A circle's project hold is checked by the team before the public sees it (13 Nov 2026).
-- Until the team approves it in the portal, "Being funded by <name>'s circle" shows nowhere, and a hold the team has
-- not approved lapses after 7 days, so a project is never locked away from real families by a stranger.
ALTER TABLE moments ADD COLUMN IF NOT EXISTS held_ok BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS held_ok_by TEXT NOT NULL DEFAULT '';
