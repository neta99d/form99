CREATE TABLE IF NOT EXISTS submissions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id      UUID        NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  account_id   TEXT        NOT NULL DEFAULT '',
  server_id    TEXT        NOT NULL DEFAULT '',
  answers      JSONB       NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_account ON submissions(account_id, server_id);
