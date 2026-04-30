import { authenticate } from "../middleware/auth";
import { jsonResponse } from "../middleware/setup";
import type { Env } from "../types";

export async function handleSessions(
  request: Request,
  env: Env,
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // GET /api/sessions
  if (request.method === "GET" && pathParts.length === 2) {
    return listSessions(auth.sub, env, url);
  }

  // POST /api/sessions
  if (request.method === "POST" && pathParts.length === 2) {
    return createSession(auth.sub, request, env);
  }

  // GET /api/sessions/:id
  if (request.method === "GET" && pathParts.length === 3) {
    return getSession(auth.sub, pathParts[2], env);
  }

  // DELETE /api/sessions/:id
  if (request.method === "DELETE" && pathParts.length === 3) {
    return deleteSession(auth.sub, pathParts[2], env);
  }

  // GET /api/sessions/:id/data
  if (
    request.method === "GET" &&
    pathParts.length === 4 &&
    pathParts[3] === "data"
  ) {
    return streamSessionData(auth.sub, pathParts[2], env);
  }

  return jsonResponse({ error: "Not found" }, 404);
}

async function listSessions(
  userId: string,
  env: Env,
  url: URL,
): Promise<Response> {
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
  const offset = (page - 1) * limit;

  const result = await env.DB.prepare(
    `SELECT id, vehicle_id, vehicle_name, started_at, ended_at,
            duration_seconds, max_speed_kmh, avg_speed_kmh, distance_km,
            max_rpm, avg_rpm, max_coolant_temp, csv_row_count, created_at
     FROM sessions
     WHERE user_id = ?
     ORDER BY started_at DESC
     LIMIT ? OFFSET ?`,
  )
    .bind(userId, limit, offset)
    .all();

  const countResult = await env.DB.prepare(
    "SELECT COUNT(*) as total FROM sessions WHERE user_id = ?",
  ).bind(userId).all<{ total: number }>();

  const total = countResult.results[0]?.total || 0;

  return jsonResponse({
    sessions: result.results,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

async function createSession(
  userId: string,
  request: Request,
  env: Env,
): Promise<Response> {
  const body = await request.json() as {
    sessionId?: string;
    vehicleId?: string;
    vehicleName?: string;
    notes?: string;
  };

  const sessionId = body.sessionId || crypto.randomUUID();
  const now = new Date().toISOString();
  const r2Key = `sessions/${userId}/${sessionId}/data.csv`;

  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, vehicle_id, vehicle_name, r2_key, started_at, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      sessionId,
      userId,
      body.vehicleId || "",
      body.vehicleName || "",
      r2Key,
      now,
      body.notes || "",
      now,
    )
    .run();

  return jsonResponse({ id: sessionId, r2Key }, 201);
}

async function getSession(
  userId: string,
  sessionId: string,
  env: Env,
): Promise<Response> {
  const result = await env.DB.prepare(
    "SELECT * FROM sessions WHERE id = ? AND user_id = ?",
  ).bind(sessionId, userId).all();

  if (result.results.length === 0) {
    return jsonResponse({ error: "Session not found" }, 404);
  }

  return jsonResponse(result.results[0]);
}

async function deleteSession(
  userId: string,
  sessionId: string,
  env: Env,
): Promise<Response> {
  const result = await env.DB.prepare(
    "SELECT r2_key FROM sessions WHERE id = ? AND user_id = ?",
  ).bind(sessionId, userId).all<{ r2_key: string }>();

  if (result.results.length === 0) {
    return jsonResponse({ error: "Session not found" }, 404);
  }

  const r2Key = result.results[0].r2_key;

  await env.DB.prepare(
    "DELETE FROM sessions WHERE id = ? AND user_id = ?",
  ).bind(sessionId, userId).run();

  try {
    await env.LOGS_BUCKET.delete(r2Key);
  } catch {
    // File might not exist
  }

  return jsonResponse({ message: "Session deleted" });
}

async function streamSessionData(
  userId: string,
  sessionId: string,
  env: Env,
): Promise<Response> {
  const result = await env.DB.prepare(
    "SELECT r2_key FROM sessions WHERE id = ? AND user_id = ?",
  ).bind(sessionId, userId).all<{ r2_key: string }>();

  if (result.results.length === 0) {
    return jsonResponse({ error: "Session not found" }, 404);
  }

  const r2Key = result.results[0].r2_key;
  const obj = await env.LOGS_BUCKET.get(r2Key);

  if (!obj || !obj.body) {
    return jsonResponse({ error: "Data file not found" }, 404);
  }

  return new Response(obj.body, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="session_${sessionId}.csv"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
