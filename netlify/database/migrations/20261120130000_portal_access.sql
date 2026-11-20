-- Portal admins added by email (SURESH, 20 Nov 2026: "give admin rights to my cousins and friends so they can see the dashboard").
-- An admin adds someone in the portal (Team & logins). When that person signs in on raavanaa.org with the same email
-- (email and password, or Google), they can open the team dashboard at /portal.
--   role      'admin' (sees everything, approves, adds or removes people) or 'team' (sees and works on the dashboard)
--   added_by  email of the admin who added them
CREATE TABLE IF NOT EXISTS portal_access (
  email     TEXT PRIMARY KEY,
  name      TEXT NOT NULL DEFAULT '',
  role      TEXT NOT NULL DEFAULT 'admin',
  added_by  TEXT NOT NULL DEFAULT '',
  added_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
