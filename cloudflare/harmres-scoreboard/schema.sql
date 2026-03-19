CREATE TABLE IF NOT EXISTS harmres_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  moves INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_harmres_scores_rank
  ON harmres_scores (score DESC, moves ASC, created_at ASC);
