PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  netid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  major TEXT NOT NULL,
  year TEXT NOT NULL,
  languages_json TEXT NOT NULL,
  looking_for_json TEXT NOT NULL,
  activity_interests_json TEXT NOT NULL,
  dku_openness INTEGER NOT NULL,
  interaction_style INTEGER NOT NULL,
  openness_to_new_activities INTEGER NOT NULL,
  planning_style INTEGER NOT NULL,
  social_energy INTEGER NOT NULL,
  communication_style INTEGER NOT NULL,
  conversation_preference INTEGER NOT NULL,
  decision_making INTEGER NOT NULL,
  conflict_handling INTEGER NOT NULL,
  emotional_sharing INTEGER NOT NULL,
  qualities_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_user_id ON survey_responses(user_id);

CREATE TABLE IF NOT EXISTS match_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  triggered_by TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  pair_count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS match_pairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL,
  user_a_id INTEGER NOT NULL,
  user_b_id INTEGER NOT NULL,
  score REAL NOT NULL,
  explanation_json TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES match_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  mode TEXT NOT NULL,
  status_code INTEGER,
  provider_response TEXT,
  sent_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
