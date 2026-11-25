-- Groups and organisations (SURESH 25 Nov 2026, option B "one profile, three badges"):
-- every profile is a community_groups row; profile_type says what it is.
--   group          a circle of friends, family, past pupils... (money stays in their own circle)
--   organisation   says it is registered: reg_body + reg_number (e.g. NGO Secretariat, Companies Act), website, logo
--   verified       only the team sets it, after seeing the registration certificate (kept off the site)
-- A group can grow into an organisation: same page, same followers. Changing the registration number clears verified.
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS profile_type TEXT NOT NULL DEFAULT 'group';
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS reg_body TEXT NOT NULL DEFAULT '';
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS reg_number TEXT NOT NULL DEFAULT '';
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS website TEXT NOT NULL DEFAULT '';
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS logo TEXT NOT NULL DEFAULT '';
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS verified_by TEXT NOT NULL DEFAULT '';
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
