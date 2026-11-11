-- The AI check is started by the portal (which checks the team sign-in) and handed to the background function with
-- a one-time job code, so the background function no longer needs to read the sign-in itself.
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS ai_job TEXT NOT NULL DEFAULT '';
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS ai_by TEXT NOT NULL DEFAULT '';
