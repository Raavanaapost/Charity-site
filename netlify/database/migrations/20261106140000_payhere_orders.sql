-- Card payments through PayHere (Sri Lanka, in rupees), alongside Stripe.
-- An order is written when a giver starts paying; PayHere's signed notification (/api/give/payhere) then marks it
-- paid and records the gift in `gifts`. Rupee gifts are stored in rupee cents with currency 'lkr'.

CREATE TABLE give_orders (
  order_id      TEXT PRIMARY KEY,                    -- sent to PayHere as order_id
  kind          TEXT NOT NULL CHECK (kind IN ('project', 'general', 'member')),
  project_slug  TEXT NOT NULL DEFAULT '',
  amount_cents  INTEGER NOT NULL CHECK (amount_cents > 0),   -- what reaches the cause
  fee_cents     INTEGER NOT NULL DEFAULT 0,                  -- extra the giver chose to add for the card fee
  currency      TEXT NOT NULL DEFAULT 'lkr',
  display_name  TEXT NOT NULL DEFAULT '',
  show_name     BOOLEAN NOT NULL DEFAULT FALSE,
  email         TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'started',   -- started | pending | paid | cancelled | failed | charged_back
  payment_id    TEXT NOT NULL DEFAULT '',
  livemode      BOOLEAN NOT NULL DEFAULT FALSE,    -- false for PayHere sandbox payments
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Which card service a gift or monthly member came through. The `stripe_id` column holds PayHere payments as 'ph_<payment_id>'.
ALTER TABLE gifts ADD COLUMN provider TEXT NOT NULL DEFAULT 'stripe';
ALTER TABLE members ADD COLUMN provider TEXT NOT NULL DEFAULT 'stripe';
