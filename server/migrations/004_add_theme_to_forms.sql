-- Add theme column to the forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS theme JSONB;

-- Back-fill a sensible default theme for every existing form
UPDATE forms
SET theme = '{
  "backgroundColor": "#ffffff",
  "questionsBackgroundColor": "#f9fafb",
  "primaryColor": "#6366f1",
  "questionsColor": "#1a1a2e",
  "answersColor": "#374151",
  "font": "inherit",
  "logo": "",
  "position": "default",
  "image": "",
  "questionsSize": 16
}'::jsonb
WHERE theme IS NULL;
