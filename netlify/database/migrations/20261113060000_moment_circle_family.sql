-- Family circle, in family words (SURESH, 13 Nov 2026): an invite says who it is from and to, the way a family talks
-- ("Malar Akka, it's me, Ravi"), so the person who opens it knows it is really from their own brother or best friend.
ALTER TABLE moment_invites ADD COLUMN IF NOT EXISTS relation TEXT NOT NULL DEFAULT '';   -- Akka, Annan, Thambi, friend...
ALTER TABLE moment_invites ADD COLUMN IF NOT EXISTS from_name TEXT NOT NULL DEFAULT '';  -- the organiser's own name on this invite

-- A circle can choose one project and hold it, so two circles never take the same one. The project then shows
-- "Being funded by <name>'s circle". The organiser can let it go again.
ALTER TABLE moments ADD COLUMN IF NOT EXISTS held_slug TEXT NOT NULL DEFAULT '';
ALTER TABLE moments ADD COLUMN IF NOT EXISTS held_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS moments_held_slug_once ON moments (held_slug) WHERE held_slug <> '' AND NOT hidden;
