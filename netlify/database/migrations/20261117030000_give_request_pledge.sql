-- Simple project pledge (SURESH, 17 Nov 2026): a pledge shows on the project straight away, with the name and amount,
-- and the project's % bar goes up. The team takes a fake or cancelled one off by closing it in the portal.
--   amount_value  the amount as a number, in the project's own money (Rs for the Kandy trip), so it adds to the bar
--   member_email  the signed-in member who sent it (My account lists it), or '' when not signed in
--   follow        the giver asked to follow the project (My account, with the same email)
ALTER TABLE give_requests ADD COLUMN IF NOT EXISTS amount_value NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE give_requests ADD COLUMN IF NOT EXISTS member_email TEXT NOT NULL DEFAULT '';
ALTER TABLE give_requests ADD COLUMN IF NOT EXISTS follow BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS give_requests_project_idx ON give_requests (project_slug, status);
