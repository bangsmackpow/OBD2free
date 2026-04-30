import { authenticate } from "../middleware/auth";
import { jsonResponse } from "../middleware/setup";
import type { Env } from "../types";

export async function handleUpload(
  request: Request,
  env: Env,
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // POST /api/upload/:sessionId - upload CSV data for a session
  if (pathParts.length === 3) {
    return uploadSessionData(auth.sub, pathParts[2], request, env);
  }

  // POST /api/upload - upload CSV data with sessionId in body
  if (pathParts.length === 2) {
    return uploadSessionData(auth.sub, "", request, env);
  }

  return jsonResponse({ error: "Not found" }, 404);
}

async function uploadSessionData(
  userId: string,
  sessionIdParam: string,
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const contentType = request.headers.get("Content-Type") || "";

    let sessionId = sessionIdParam;
    let csvData: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const sid = formData.get("sessionId") as string | null;

      if (!file) return jsonResponse({ error: "No file provided" }, 400);

      sessionId = sessionId || sid || crypto.randomUUID();
      csvData = await file.text();
    } else if (contentType.includes("application/json")) {
      const body = await request.json() as { sessionId?: string; data?: string; csv?: string };
      sessionId = sessionId || body.sessionId || crypto.randomUUID();
      csvData = body.data || body.csv || "";
    } else {
      csvData = await request.text();
      sessionId = sessionId || crypto.randomUUID();
    }

    if (!csvData.trim()) {
      return jsonResponse({ error: "No CSV data provided" }, 400);
    }

    // Parse basic stats from CSV
    const lines = csvData.trim().split("\n");
    const rowCount = Math.max(0, lines.length - 1); // Subtract header
    const stats = parseBasicStats(lines);

    const r2Key = `sessions/${userId}/${sessionId}/data.csv`;
    const now = new Date().toISOString();

    // Upload CSV to R2
    await env.LOGS_BUCKET.put(r2Key, csvData, {
      httpMetadata: { contentType: "text/csv" },
      customMetadata: {
        userId,
        sessionId,
        uploadDate: now,
        rowCount: String(rowCount),
      },
    });

    // Upsert session metadata
    const existing = await env.DB.prepare(
      "SELECT id FROM sessions WHERE id = ? AND user_id = ?",
    ).bind(sessionId, userId).all();

    if (existing.results.length > 0) {
      await env.DB.prepare(
        `UPDATE sessions
         SET ended_at = COALESCE(ended_at, ?),
             csv_size = ?, csv_row_count = ?,
             max_speed_kmh = COALESCE(MAX(max_speed_kmh, ?), max_speed_kmh, ?),
             avg_speed_kmh = ?,
             distance_km = COALESCE(distance_km, ?),
             duration_seconds = COALESCE(duration_seconds, ?)
         WHERE id = ?`,
      ).bind(
        now,
        csvData.length,
        rowCount,
        stats.maxSpeed, stats.maxSpeed,
        stats.avgSpeed,
        stats.distance,
        stats.duration,
        sessionId,
      ).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO sessions (id, user_id, r2_key, started_at, ended_at,
          csv_size, csv_row_count, max_speed_kmh, avg_speed_kmh, distance_km, duration_seconds)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        sessionId,
        userId,
        r2Key,
        now,
        now,
        csvData.length,
        rowCount,
        stats.maxSpeed,
        stats.avgSpeed,
        stats.distance,
        stats.duration,
      ).run();
    }

    return jsonResponse({
      sessionId,
      rowCount,
      r2Key,
      stats,
    }, 201);
  } catch (err) {
    console.error("Upload error:", err);
    return jsonResponse({ error: "Upload failed" }, 500);
  }
}

function parseBasicStats(lines: string[]): {
  maxSpeed: number;
  avgSpeed: number;
  distance: number;
  duration: number;
} {
  if (lines.length < 2) {
    return { maxSpeed: 0, avgSpeed: 0, distance: 0, duration: 0 };
  }

  const header = lines[0].toLowerCase().split(",");
  const speedIdx = header.findIndex((h) => h.includes("speed") || h === "spd");
  const rpmIdx = header.findIndex((h) => h.includes("rpm"));
  const timeIdx = header.findIndex((h) => h.includes("time") || h.includes("timestamp"));

  let maxSpeed = 0;
  let speedSum = 0;
  let speedCount = 0;
  let firstTime: number | null = null;
  let lastTime: number | null = null;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");

    if (speedIdx >= 0) {
      const speed = parseFloat(cols[speedIdx]);
      if (!isNaN(speed)) {
        maxSpeed = Math.max(maxSpeed, speed);
        speedSum += speed;
        speedCount++;
      }
    }

    if (timeIdx >= 0) {
      const ts = parseFloat(cols[timeIdx]);
      if (!isNaN(ts)) {
        if (firstTime === null) firstTime = ts;
        lastTime = ts;
      }
    }
  }

  return {
    maxSpeed,
    avgSpeed: speedCount > 0 ? speedSum / speedCount : 0,
    distance: 0, // Calculated from GPS data
    duration: lastTime && firstTime ? Math.round(lastTime - firstTime) : 0,
  };
}
