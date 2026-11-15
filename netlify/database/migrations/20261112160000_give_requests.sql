-- "I'd like to give" (SURESH, 12 Nov 2026). At launch no money is taken on the site and no bank details are shown.
-- Someone who taps Donate leaves their name, a WhatsApp number or email, roughly how much, and which project or
-- moment it is for. A volunteer then replies to them personally. The team works through this list in the portal
-- (Sponsors & pledges). Card payments (PayHere) stay built but switched off.
CREATE SEQUENCE IF NOT EXISTS give_request_ref_seq START 1001;
CREATE TABLE IF NOT EXISTS give_requests (
  id            SERIAL PRIMARY KEY,
  ref           TEXT NOT NULL UNIQUE,                 -- G-1001: easy to say on the phone
  received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name          TEXT NOT NULL,
  contact       TEXT NOT NULL,                        -- a WhatsApp number or an email address, as typed
  amount        TEXT NOT NULL DEFAULT '',             -- roughly how much, in their own words ("Rs 5,000", "$50", "not sure yet")
  kind          TEXT NOT NULL DEFAULT 'general',      -- project, general (the Raavanaa Fund) or member (every month)
  project_slug  TEXT NOT NULL DEFAULT '',
  moment_code   TEXT NOT NULL DEFAULT '',             -- the family page (/m/<code>) it came from, if any
  tribute       JSONB,                                -- {"kind":"memory","words":"In loving memory of","name":"...","note":"...","day":"2026-11-27"}
  message       TEXT NOT NULL DEFAULT '',
  lang          TEXT NOT NULL DEFAULT 'en',
  status        TEXT NOT NULL DEFAULT 'new',          -- new, replied (a volunteer has written), received (the gift came), closed (did not go ahead)
  team_note     TEXT NOT NULL DEFAULT '',
  handled_by    TEXT NOT NULL DEFAULT '',
  handled_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS give_requests_status_idx ON give_requests (status, received_at DESC);
