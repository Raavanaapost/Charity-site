-- Vouches, ratings and comments come from signed-in accounts, with no phone or other personal details (SURESH,
-- 22 Nov 2026: "For comment, you already should have been logged in. And don't need any personal information. People
-- just will comment."). phone_key now holds 'acct:<email>' for account entries. New kind 'comment': any signed-in
-- person can write as many as they like, at any stage; vouch and rating stay one per account per project.
ALTER TABLE project_voices DROP CONSTRAINT IF EXISTS project_voices_kind_check;
ALTER TABLE project_voices ADD CONSTRAINT project_voices_kind_check CHECK (kind IN ('vouch', 'rating', 'comment'));
ALTER TABLE project_voices DROP CONSTRAINT IF EXISTS project_voices_slug_kind_phone_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS project_voices_one_each ON project_voices (slug, kind, phone_key) WHERE kind <> 'comment';
