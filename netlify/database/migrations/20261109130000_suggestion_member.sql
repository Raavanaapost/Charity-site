-- Only signed-in members can send a request (SURESH, 9 Nov 2026). Record which account sent it.
ALTER TABLE suggestions ADD COLUMN member_email TEXT NOT NULL DEFAULT '';
