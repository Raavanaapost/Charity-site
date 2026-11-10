-- The six steps from request to Initiated project are saved (SURESH, 10 Nov 2026): first call details, who verified,
-- who approved, the budget and expectations. "approved" sits between verified and project.
ALTER TABLE suggestions DROP CONSTRAINT IF EXISTS suggestions_status_check;
ALTER TABLE suggestions ADD CONSTRAINT suggestions_status_check
  CHECK (status IN ('new', 'visit', 'verified', 'approved', 'declined', 'project'));
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;  -- title, story, org, place (private), evidenceSeen
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS called DATE;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS taken_at TIMESTAMPTZ;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS verified_by TEXT NOT NULL DEFAULT '';
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS approved_by TEXT NOT NULL DEFAULT '';
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS approved_override BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS plan JSONB NOT NULL DEFAULT '{}'::jsonb;     -- lines [{item, amount}], expect [text]

-- Projects created from requests in the portal. The website shows them next to the ones in projects.json.
CREATE TABLE IF NOT EXISTS site_projects (
  id             SERIAL PRIMARY KEY,
  slug           TEXT UNIQUE NOT NULL,
  suggestion_id  INTEGER REFERENCES suggestions(id) ON DELETE SET NULL,
  data           JSONB NOT NULL,          -- the same shape as one entry of projects.json
  hidden         BOOLEAN NOT NULL DEFAULT FALSE,
  created_by     TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
