-- "Make it a moment in their name" (SURESH, 10 Nov 2026): a gift can remember someone or mark a day.
-- tribute = {"kind":"memory"|"birthday"|"anniversary"|"honour","name":"...","note":"...","show":true}
-- Shown on the project page only when "show" is true. Never a child's name: it names the person remembered.
ALTER TABLE give_orders ADD COLUMN IF NOT EXISTS tribute JSONB;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS tribute JSONB;
