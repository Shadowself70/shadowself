const JSON_HEADERS = {
  "content-type": "application/json; charset=UTF-8",
};

const DEFAULT_ALLOWED_ORIGINS = [
  "https://newsite.shadowself.ca",
  "https://shadowself.ca",
  "https://shadowself70.github.io",
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const corsHeaders = buildCorsHeaders(origin, env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true, service: "harmres-scoreboard" }, 200, corsHeaders);
      }

      if (request.method === "GET" && url.pathname === "/harmres/leaderboard") {
        return await handleGetLeaderboard(env, corsHeaders, url);
      }

      if (request.method === "POST" && url.pathname === "/harmres/score") {
        return await handleSubmitScore(request, env, corsHeaders);
      }

      return json({ error: "Not found." }, 404, corsHeaders);
    } catch (error) {
      console.error("Unhandled worker error", error);
      return json({ error: "Server error." }, 500, corsHeaders);
    }
  },
};

async function handleGetLeaderboard(env, corsHeaders, url) {
  const requestedLimit = Number.parseInt(url.searchParams.get("limit") ?? "10", 10);
  const limit = clampNumber(requestedLimit, 1, 25, 10);

  const { results } = await env.DB.prepare(
    `
      SELECT player_name, score, moves, created_at
      FROM harmres_scores
      ORDER BY score DESC, moves ASC, created_at ASC
      LIMIT ?
    `,
  )
    .bind(limit)
    .all();

  return json(
    {
      entries: (results ?? []).map((row) => ({
        playerName: row.player_name,
        score: row.score,
        moves: row.moves,
        createdAt: row.created_at,
      })),
    },
    200,
    corsHeaders,
  );
}

async function handleSubmitScore(request, env, corsHeaders) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400, corsHeaders);
  }

  const score = clampNumber(payload?.score, 0, 5000, null);
  const moves = clampNumber(payload?.moves, 0, 9999, null);
  const playerName = sanitizePlayerName(payload?.playerName);

  if (score === null || moves === null) {
    return json({ error: "Score and moves must be valid numbers." }, 400, corsHeaders);
  }

  await env.DB.prepare(
    `
      INSERT INTO harmres_scores (player_name, score, moves)
      VALUES (?, ?, ?)
    `,
  )
    .bind(playerName, score, moves)
    .run();

  return json({ ok: true }, 201, corsHeaders);
}

function buildCorsHeaders(origin, env) {
  const configuredOrigins = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS;
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    ...JSON_HEADERS,
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

function json(payload, status, corsHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders,
  });
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function sanitizePlayerName(value) {
  const raw = String(value ?? "Guest").trim().slice(0, 15);
  if (!raw) {
    return "Guest";
  }

  const filtered = raw.replace(/[<>"']/g, "");
  return filtered || "Guest";
}
