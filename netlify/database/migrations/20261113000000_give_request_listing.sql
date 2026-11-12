-- How the giver wants the gift listed in public (SURESH, 12 Nov 2026):
--   both = name and amount, name = name only (the amount is counted but not shown),
--   anonymous = "A friend of Raavanaa", own = their own wording (in listing_words).
ALTER TABLE give_requests ADD COLUMN IF NOT EXISTS listing TEXT NOT NULL DEFAULT 'both';
ALTER TABLE give_requests ADD COLUMN IF NOT EXISTS listing_words TEXT NOT NULL DEFAULT '';
