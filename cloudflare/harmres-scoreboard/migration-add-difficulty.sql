ALTER TABLE harmres_scores ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'easy';

DROP INDEX IF EXISTS idx_harmres_scores_rank;

CREATE INDEX IF NOT EXISTS idx_harmres_scores_rank
  ON harmres_scores (difficulty, score DESC, moves ASC, created_at ASC);
