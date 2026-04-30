import { hashPassword, generateToken } from "../utils";
import type { Env } from "../types";

export async function ensureAdminUser(env: Env): Promise<void> {
  try {
    const result = await env.DB.prepare(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1",
    ).all();

    if (result.results.length === 0) {
      const id = generateToken();
      const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

      await env.DB.prepare(
        `INSERT INTO users (id, email, password_hash, display_name, role, premium_level)
         VALUES (?, ?, ?, ?, 'admin', 'lifetime')`,
      )
        .bind(id, env.ADMIN_EMAIL, passwordHash, "Admin")
        .run();

      console.log(`Created admin user: ${env.ADMIN_EMAIL}`);
    }
  } catch (err) {
    console.error("Failed to ensure admin user:", err);
  }
}

export async function jsonResponse(
  data: unknown,
  status = 200,
): Promise<Response> {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function uuid(): string {
  return crypto.randomUUID();
}
