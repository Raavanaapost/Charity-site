-- Evidence for a suggestion: photos, documents or short videos (files kept in Netlify Blobs), or a promise to show it at the visit.
ALTER TABLE suggestions ADD COLUMN upload_nonce TEXT NOT NULL DEFAULT '';
ALTER TABLE suggestions ADD COLUMN no_evidence BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE suggestion_files (
  id             SERIAL PRIMARY KEY,
  suggestion_id  INTEGER NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  file_key       TEXT UNIQUE NOT NULL,   -- <upload nonce>/<file id>; parts are stored as <file_key>/<n>
  name           TEXT NOT NULL DEFAULT '',
  type           TEXT NOT NULL DEFAULT '',
  size           INTEGER NOT NULL DEFAULT 0,
  parts          INTEGER NOT NULL DEFAULT 1,
  complete       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX suggestion_files_sid_idx ON suggestion_files (suggestion_id);
