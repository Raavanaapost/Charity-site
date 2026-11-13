-- Simpler Gift a Moment before launch (SURESH, 13 Nov 2026).
-- A page is a family circle or a friends circle, chosen when it is made; the page then shows only what that circle needs.
-- "others": the other names under "From" (e.g. "Malar, Kumar and the kids"), shown on the Moment Card.
-- "also_slugs": more projects chosen with the heart, after the first one (comma separated).
ALTER TABLE moments ADD COLUMN IF NOT EXISTS circle_type TEXT NOT NULL DEFAULT 'family';
ALTER TABLE moments ADD COLUMN IF NOT EXISTS others TEXT NOT NULL DEFAULT '';
ALTER TABLE moments ADD COLUMN IF NOT EXISTS also_slugs TEXT NOT NULL DEFAULT '';
