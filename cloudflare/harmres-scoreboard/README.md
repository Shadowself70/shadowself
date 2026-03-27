# Harmonic Resonance Scoreboard Worker

This Worker provides:

- `GET /harmres/leaderboard`
- `POST /harmres/score`

It stores scores in Cloudflare D1 instead of Firebase.

## Payload

```json
{
  "playerName": "Guest",
  "score": 860,
  "moves": 14,
  "difficulty": "medium"
}
```

## Query Parameters

- `difficulty`: `easy`, `medium`, or `hard`
- `limit`: 1-25, defaults to `10`

## Existing Database Migration

If your D1 table already exists, run this once before deploying the updated worker:

```sql
ALTER TABLE harmres_scores ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'easy';
DROP INDEX IF EXISTS idx_harmres_scores_rank;
CREATE INDEX IF NOT EXISTS idx_harmres_scores_rank
  ON harmres_scores (difficulty, score DESC, moves ASC, created_at ASC);
```

## Files

- `wrangler.toml` - Worker config and D1 binding
- `schema.sql` - D1 schema
- `src/index.mjs` - Worker code
