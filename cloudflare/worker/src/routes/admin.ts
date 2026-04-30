import { authenticate, requireAdmin } from "../middleware/auth";
import { jsonResponse, uuid } from "../middleware/setup";
import { hashPassword } from "../utils";
import type { Env } from "../types";

export async function handleAdmin(
  request: Request,
  env: Env,
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (!requireAdmin(auth)) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // GET /api/admin/users
  if (request.method === "GET" && pathParts.length === 3 && pathParts[2] === "users") {
    return listUsers(env, url);
  }

  // GET /api/admin/users/:id
  if (request.method === "GET" && pathParts.length === 4 && pathParts[2] === "users") {
    return getUserDetail(pathParts[3], env);
  }

  // PUT /api/admin/users/:id
  if (request.method === "PUT" && pathParts.length === 4 && pathParts[2] === "users") {
    return updateUser(pathParts[3], request, env);
  }

  // GET /api/admin/stats
  if (request.method === "GET" && pathParts.length === 3 && pathParts[2] === "stats") {
    return getStats(env);
  }

  return jsonResponse({ error: "Not found" }, 404);
}

async function listUsers(env: Env, url: URL): Promise<Response> {
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = (page - 1) * limit;
  const search = url.searchParams.get("search") || "";

  let query = "SELECT id, email, display_name, role, premium_level, premium_expiry, created_at FROM users";
  let countQuery = "SELECT COUNT(*) as total FROM users";
  const params: string[] = [];

  if (search) {
    const where = " WHERE email LIKE ? OR display_name LIKE ?";
    query += where;
    countQuery += where;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";

  const users = await env.DB.prepare(query)
    .bind(...params, limit, offset)
    .all();

  const countResult = await env.DB.prepare(countQuery)
    .bind(...params)
    .all<{ total: number }>();

  const total = countResult.results[0]?.total || 0;

  return jsonResponse({
    users: users.results,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

async function getUserDetail(userId: string, env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    `SELECT u.id, u.email, u.display_name, u.role, u.premium_level,
            u.premium_expiry, u.created_at, u.updated_at,
            (SELECT COUNT(*) FROM sessions WHERE user_id = u.id) as session_count,
            (SELECT COALESCE(SUM(csv_size), 0) FROM sessions WHERE user_id = u.id) as total_storage,
            (SELECT COUNT(*) FROM devices WHERE user_id = u.id) as device_count
     FROM users u WHERE u.id = ?`,
  ).bind(userId).all();

  if (result.results.length === 0) {
    return jsonResponse({ error: "User not found" }, 404);
  }

  return jsonResponse(result.results[0]);
}

async function updateUser(
  userId: string,
  request: Request,
  env: Env,
): Promise<Response> {
  const body = await request.json() as {
    email?: string;
    display_name?: string;
    role?: string;
    premium_level?: string;
    premium_expiry?: number | null;
    password?: string;
  };

  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (body.email) {
    updates.push("email = ?");
    params.push(body.email.toLowerCase().trim());
  }
  if (body.display_name !== undefined) {
    updates.push("display_name = ?");
    params.push(body.display_name);
  }
  if (body.role) {
    if (!["user", "admin"].includes(body.role)) {
      return jsonResponse({ error: "Invalid role" }, 400);
    }
    updates.push("role = ?");
    params.push(body.role);
  }
  if (body.premium_level) {
    if (!["free", "premium", "lifetime"].includes(body.premium_level)) {
      return jsonResponse({ error: "Invalid premium level" }, 400);
    }
    updates.push("premium_level = ?");
    params.push(body.premium_level);
  }
  if (body.premium_expiry !== undefined) {
    updates.push("premium_expiry = ?");
    params.push(body.premium_expiry);
  }
  if (body.password) {
    if (body.password.length < 8) {
      return jsonResponse({ error: "Password must be at least 8 characters" }, 400);
    }
    const passwordHash = await hashPassword(body.password);
    updates.push("password_hash = ?");
    params.push(passwordHash);
  }

  if (updates.length === 0) {
    return jsonResponse({ error: "No fields to update" }, 400);
  }

  updates.push("updated_at = datetime('now')");
  params.push(userId);

  await env.DB.prepare(
    `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
  ).bind(...params).run();

  return jsonResponse({ message: "User updated" });
}

async function getStats(env: Env): Promise<Response> {
  const userCount = await env.DB.prepare(
    "SELECT COUNT(*) as total FROM users",
  ).all<{ total: number }>();

  const sessionStats = await env.DB.prepare(
    `SELECT
      COUNT(*) as total_sessions,
      COALESCE(SUM(csv_size), 0) as total_storage,
      COALESCE(SUM(csv_row_count), 0) as total_rows
     FROM sessions`,
  ).all<{ total_sessions: number; total_storage: number; csv_row_count: number }>();

  const premiumCount = await env.DB.prepare(
    "SELECT COUNT(*) as total FROM users WHERE premium_level IN ('premium', 'lifetime')",
  ).all<{ total: number }>();

  return jsonResponse({
    users: { total: userCount.results[0]?.total || 0 },
    sessions: {
      total: sessionStats.results[0]?.total_sessions || 0,
      totalStorage: sessionStats.results[0]?.total_storage || 0,
      totalRows: sessionStats.results[0]?.total_rows || 0,
    },
    premium: { total: premiumCount.results[0]?.total || 0 },
  });
}
