-- One vouch can be enough (SURESH, 20 Nov 2026: "Some projects, we should be able override with one person, because that's
-- enough. But only admins can do."). When an admin sets this, a request with at least one vouch counts as "Vouched"
-- (community-backed) on its page and in the portal, without waiting for 3 people and someone in a role.
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS vouch_ok_by TEXT NOT NULL DEFAULT '';
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS vouch_ok_at TIMESTAMPTZ;
