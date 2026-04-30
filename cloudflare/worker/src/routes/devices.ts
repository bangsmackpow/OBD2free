import { authenticate } from "../middleware/auth";
import { jsonResponse, uuid } from "../middleware/setup";
import { generateToken } from "../utils";
import type { Env } from "../types";

export async function handleDevices(
  request: Request,
  env: Env,
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  switch (request.method) {
    case "GET":
      return listDevices(auth.sub, env);
    case "POST":
      return registerDevice(auth.sub, request, env);
    case "DELETE":
      if (pathParts.length === 3) {
        return deleteDevice(auth.sub, pathParts[2], env);
      }
      return jsonResponse({ error: "Not found" }, 404);
    default:
      return jsonResponse({ error: "Not found" }, 404);
  }
}

async function listDevices(userId: string, env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    `SELECT id, device_name, device_type, last_seen_at, created_at
     FROM devices WHERE user_id = ? ORDER BY last_seen_at DESC`,
  ).bind(userId).all();

  return jsonResponse({ devices: result.results });
}

async function registerDevice(
  userId: string,
  request: Request,
  env: Env,
): Promise<Response> {
  const body = await request.json() as {
    device_name?: string;
    device_type?: string;
  };

  const id = uuid();
  const token = await generateToken();

  await env.DB.prepare(
    `INSERT INTO devices (id, user_id, device_name, device_type, token_hash)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(id, userId, body.device_name || "", body.device_type || "mobile", token).run();

  return jsonResponse({ id, token }, 201);
}

async function deleteDevice(
  userId: string,
  deviceId: string,
  env: Env,
): Promise<Response> {
  await env.DB.prepare(
    "DELETE FROM devices WHERE id = ? AND user_id = ?",
  ).bind(deviceId, userId).run();

  return jsonResponse({ message: "Device deleted" });
}
