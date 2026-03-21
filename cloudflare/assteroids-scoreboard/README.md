# Assteroids Scoreboard Worker

This Worker provides:

- GET /assteroids/leaderboard
- POST /assteroids/score

It stores scores in Cloudflare D1 instead of Firebase.

## Payload

`json
{
  ""playerName"": ""Guest"",
  ""score"": 860
}
`

## Files

- wrangler.toml - Worker config and D1 binding
- schema.sql - D1 schema
- src/index.mjs - Worker code