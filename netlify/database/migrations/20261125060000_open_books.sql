-- Open Books (SURESH, 25 Nov 2026: "a dashboard summary ... how much funded from around the world, the people funded,
-- which projects and dates"). Three small facts per gift, so raavanaa.org/money can show them:
--   country      where the giver is giving from, one tap on the Be the smile form (country only, never a city)
--   currency     the money they typed it in (CAD, GBP, LKR ...); amount_value stays in the project's own money
--   received_on  the day the team pressed "Gift received" in the portal (Promised until then)
ALTER TABLE give_requests ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT '';
ALTER TABLE give_requests ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT '';
ALTER TABLE give_requests ADD COLUMN IF NOT EXISTS received_on DATE;
-- Older gifts: the currency is the first word of the amount text ("CAD 50 (about Rs 11,634)"), or Rs for rupees.
UPDATE give_requests SET currency = substring(amount from '^([A-Z]{3}) ') WHERE currency = '' AND amount ~ '^[A-Z]{3} ';
UPDATE give_requests SET currency = 'LKR' WHERE currency = '' AND amount ~* '^\s*(rs|lkr)';
-- Gifts already marked received keep the day they were marked.
UPDATE give_requests SET received_on = handled_at::date WHERE status = 'received' AND received_on IS NULL AND handled_at IS NOT NULL;
