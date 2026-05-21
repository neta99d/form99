ALTER TABLE forms ADD COLUMN IF NOT EXISTS server_id TEXT NOT NULL DEFAULT '';
ALTER TABLE forms ADD COLUMN IF NOT EXISTS name TEXT;

UPDATE forms SET name = id::text WHERE name IS NULL;

ALTER TABLE forms ALTER COLUMN name SET NOT NULL;
ALTER TABLE forms ALTER COLUMN name SET DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_forms_server_account_name
  ON forms(server_id, account_id, name);
