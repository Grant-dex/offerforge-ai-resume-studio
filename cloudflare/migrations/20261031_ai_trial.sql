CREATE TABLE IF NOT EXISTS ai_trial_usage (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_trial_day_visitor ON ai_trial_usage(day, visitor_hash);
