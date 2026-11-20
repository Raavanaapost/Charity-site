-- Two ways in for a request (SURESH, 20 Nov 2026):
--   request_type  'open'     anyone sends it (often for themselves, or they don't know anyone there)
--                 'referred' sent for someone who asked; incharge_* is that person, who checks the page and vouches
-- The team makes the page, sends it to the person in charge, and their vouch puts it live on Projects.
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS request_type   TEXT NOT NULL DEFAULT 'open';
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS incharge_name  TEXT NOT NULL DEFAULT '';
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS incharge_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS incharge_email TEXT NOT NULL DEFAULT '';
-- Who vouched while signed in, so their My account can list the projects they vouched for.
ALTER TABLE endorsements ADD COLUMN IF NOT EXISTS member_email TEXT NOT NULL DEFAULT '';
