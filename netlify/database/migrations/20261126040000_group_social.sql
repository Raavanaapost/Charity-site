-- Each group or organisation profile can show its own Facebook Page and Instagram as "Follow us" links (SURESH 26 Nov 2026).
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS facebook TEXT NOT NULL DEFAULT '';
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS instagram TEXT NOT NULL DEFAULT '';
