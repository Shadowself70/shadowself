CREATE TABLE IF NOT EXISTS assteroids_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assteroids_scores_rank
  ON assteroids_scores (score DESC, created_at ASC);