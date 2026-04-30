import { hashPassword } from "../utils";
import type { Env } from "../types";

export async function ensureAdminUser(env: Env): Promise<void> {
  try {
    const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

    // Upsert admin user — create if not exists, update password on redeploy
    const result = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ?",
    ).bind(env.ADMIN_EMAIL).all();

    if (result.results.length === 0) {
      const id = crypto.randomUUID();

      await env.DB.prepare(
        `INSERT INTO users (id, email, password_hash, display_name, role, premium_level)
         VALUES (?, ?, ?, ?, 'admin', 'lifetime')`,
      )
        .bind(id, env.ADMIN_EMAIL, passwordHash, "Admin")
        .run();

      console.log(`Created admin user: ${env.ADMIN_EMAIL}`);
    } else {
      // Update password hash on every deploy to stay in sync
      const existing = result.results[0] as { id: string };
      await env.DB.prepare(
        "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
      ).bind(passwordHash, existing.id).run();

      console.log(`Updated admin password hash: ${env.ADMIN_EMAIL}`);
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
