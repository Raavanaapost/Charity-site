-- Request dashboard (SURESH, 9 Nov 2026): an AI draft of each request, read from what was sent (text, documents,
-- photos, video, voice notes), with the missing details flagged. The team checks it and approves the request's page
-- before the requester can share it for people to vouch.
ALTER TABLE suggestions ADD COLUMN ai_draft    JSONB NOT NULL DEFAULT '{}'::jsonb;  -- what Gemini wrote, as it wrote it
ALTER TABLE suggestions ADD COLUMN ai_status   TEXT NOT NULL DEFAULT '';            -- '' | running | done | failed
ALTER TABLE suggestions ADD COLUMN ai_error    TEXT NOT NULL DEFAULT '';
ALTER TABLE suggestions ADD COLUMN ai_at       TIMESTAMPTZ;
ALTER TABLE suggestions ADD COLUMN profile     JSONB NOT NULL DEFAULT '{}'::jsonb;  -- the page people see, as the team approved it
ALTER TABLE suggestions ADD COLUMN share_ok    BOOLEAN NOT NULL DEFAULT FALSE;      -- approved for sharing and vouching
ALTER TABLE suggestions ADD COLUMN share_ok_by TEXT NOT NULL DEFAULT '';
ALTER TABLE suggestions ADD COLUMN share_ok_at TIMESTAMPTZ;
CREATE INDEX suggestions_member_idx ON suggestions (member_email) WHERE member_email <> '';
