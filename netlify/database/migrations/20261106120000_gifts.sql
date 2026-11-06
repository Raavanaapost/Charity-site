-- Card payments through Stripe: every gift that has been paid, and the monthly Smile members.
-- Rows are written only by the Stripe webhook (/api/give/webhook), after Stripe confirms the payment.

CREATE TABLE gifts (
  id              SERIAL PRIMARY KEY,
  stripe_id       TEXT UNIQUE NOT NULL,             -- Checkout Session id (one-time) or Invoice id (monthly)
  kind            TEXT NOT NULL CHECK (kind IN ('project', 'general', 'member')),
  project_slug    TEXT NOT NULL DEFAULT '',
  amount_cents    INTEGER NOT NULL CHECK (amount_cents > 0),   -- what reaches the cause (any extra for the card fee is not counted)
  paid_cents      INTEGER NOT NULL CHECK (paid_cents > 0),     -- what the person actually paid
  currency        TEXT NOT NULL DEFAULT 'cad',
  display_name    TEXT NOT NULL DEFAULT '',
  show_name       BOOLEAN NOT NULL DEFAULT FALSE,   -- names are shown only with permission
  email           TEXT NOT NULL DEFAULT '',
  subscription_id TEXT NOT NULL DEFAULT '',
  livemode        BOOLEAN NOT NULL DEFAULT FALSE,   -- false for Stripe test payments
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX gifts_project_idx ON gifts (project_slug, livemode);

CREATE TABLE members (
  id              SERIAL PRIMARY KEY,
  subscription_id TEXT UNIQUE NOT NULL,
  display_name    TEXT NOT NULL DEFAULT '',
  show_name       BOOLEAN NOT NULL DEFAULT FALSE,
  email           TEXT NOT NULL DEFAULT '',
  monthly_cents   INTEGER NOT NULL DEFAULT 0,
  fee_cents       INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'active',   -- active | canceled
  livemode        BOOLEAN NOT NULL DEFAULT FALSE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
