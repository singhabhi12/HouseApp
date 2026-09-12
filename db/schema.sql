-- Issues reported by residents. Photo bytes live in the row so no extra
-- storage service is needed for a 5-person house.
CREATE TABLE IF NOT EXISTS issues (
  id          SERIAL PRIMARY KEY,
  section     TEXT NOT NULL,
  description TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  photo       BYTEA,
  photo_type  TEXT,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS issues_status_created_idx ON issues (status, created_at DESC);
