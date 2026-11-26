-- Follow every rupee (SURESH 26 Nov 2026, option B: "Lets build B for now").
-- Every gift moves Promised -> Received -> Handed over -> Spent (with receipt) -> Books closed, and a second team member
-- checks each step before it shows on the project's money page.
--   give_requests  sent_value / arrived_lkr / fee_lkr: what the giver sent in their own money, what reached the bank in
--                  rupees and the bank's fee, so the money page shows the rate and fees openly.
--   project_updates line / checked_by / checked_at / entered_email: a receipt belongs to a budget line ("Bus", "Food")
--                  and shows on the money page only once a team member (not the one who entered it) has checked it.
--   money_handovers money Raavanaa passes to the organiser: how much, when, how, to whom. The organiser ticks
--                  "I received it" on their phone (/got/<token>) and a second team member checks it.
--   money_books    one row per project when its books are closed: what was left over and where it went.
ALTER TABLE give_requests ADD COLUMN IF NOT EXISTS sent_value NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE give_requests ADD COLUMN IF NOT EXISTS arrived_lkr NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE give_requests ADD COLUMN IF NOT EXISTS fee_lkr NUMERIC(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS line TEXT NOT NULL DEFAULT '';
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS entered_email TEXT NOT NULL DEFAULT '';
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS checked_by TEXT NOT NULL DEFAULT '';
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS checked_email TEXT NOT NULL DEFAULT '';
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS checked_at TIMESTAMPTZ;
ALTER TABLE project_updates ADD COLUMN IF NOT EXISTS spent_on DATE;

CREATE TABLE IF NOT EXISTS money_handovers (
  id             SERIAL PRIMARY KEY,
  slug           TEXT NOT NULL,
  amount         NUMERIC(12, 2) NOT NULL DEFAULT 0,
  handed_on      DATE,
  method         TEXT NOT NULL DEFAULT '',
  to_name        TEXT NOT NULL DEFAULT '',
  to_role        TEXT NOT NULL DEFAULT '',
  note           TEXT NOT NULL DEFAULT '',
  token          TEXT NOT NULL UNIQUE DEFAULT md5(random()::text || clock_timestamp()::text),
  confirmed_at   TIMESTAMPTZ,
  confirmed_name TEXT NOT NULL DEFAULT '',
  entered_by     TEXT NOT NULL DEFAULT '',
  entered_email  TEXT NOT NULL DEFAULT '',
  checked_by     TEXT NOT NULL DEFAULT '',
  checked_email  TEXT NOT NULL DEFAULT '',
  checked_at     TIMESTAMPTZ,
  hidden         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS money_handovers_slug_idx ON money_handovers (slug);

CREATE TABLE IF NOT EXISTS money_books (
  slug            TEXT PRIMARY KEY,
  leftover_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  leftover_to     TEXT NOT NULL DEFAULT '',
  closed_by       TEXT NOT NULL DEFAULT '',
  closed_email    TEXT NOT NULL DEFAULT '',
  closed_at       TIMESTAMPTZ
);
