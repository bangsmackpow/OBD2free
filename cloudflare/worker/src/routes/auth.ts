import { createJWT, hashPassword, verifyPassword, generateToken } from "../utils";
import { authenticate } from "../middleware/auth";
import { jsonResponse, uuid } from "../middleware/setup";
import type { Env } from "../types";

export async function handleAuth(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  switch (path) {
    case "/api/auth/register":
      return register(request, env);
    case "/api/auth/login":
      return login(request, env);
    case "/api/auth/refresh":
      return refresh(request, env);
    case "/api/auth/forgot-password":
      return forgotPassword(request, env);
    case "/api/auth/reset-password":
      return resetPassword(request, env);
    case "/api/auth/me":
      return getMe(request, env);
    default:
      return jsonResponse({ error: "Not found" }, 404);
  }
}

async function register(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as {
      email: string;
      password: string;
      display_name?: string;
    };

    if (!body.email || !body.password) {
      return jsonResponse({ error: "Email and password required" }, 400);
    }
    if (body.password.length < 8) {
      return jsonResponse({ error: "Password must be at least 8 characters" }, 400);
    }

    // Check if user exists
    const existing = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ?",
    ).bind(body.email.toLowerCase().trim()).all();

    if (existing.results.length > 0) {
      return jsonResponse({ error: "Email already registered" }, 409);
    }

    const id = uuid();
    const passwordHash = await hashPassword(body.password);

    await env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, display_name)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(id, body.email.toLowerCase().trim(), passwordHash, body.display_name || "")
      .run();

    const token = await createJWT(
      {
        sub: id,
        email: body.email.toLowerCase().trim(),
        role: "user",
        premium_level: "free",
      },
      env.JWT_SECRET,
    );

    return jsonResponse({
      token,
      user: { id, email: body.email.toLowerCase().trim(), role: "user", premium_level: "free" },
    }, 201);
  } catch (err) {
    console.error("Register error:", err);
    return jsonResponse({ error: "Registration failed" }, 500);
  }
}

async function login(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { email: string; password: string };

    if (!body.email || !body.password) {
      return jsonResponse({ error: "Email and password required" }, 400);
    }

    const result = await env.DB.prepare(
      "SELECT * FROM users WHERE email = ?",
    ).bind(body.email.toLowerCase().trim()).all<{
      id: string;
      email: string;
      password_hash: string;
      display_name: string;
      role: string;
      premium_level: string;
      premium_expiry: number | null;
      created_at: string;
    }>();

    if (result.results.length === 0) {
      return jsonResponse({ error: "Invalid email or password" }, 401);
    }

    const user = result.results[0];
    const valid = await verifyPassword(body.password, user.password_hash);
    if (!valid) {
      return jsonResponse({ error: "Invalid email or password" }, 401);
    }

    const token = await createJWT(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        premium_level: user.premium_level,
      },
      env.JWT_SECRET,
    );

    return jsonResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        premium_level: user.premium_level,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return jsonResponse({ error: "Login failed" }, 500);
  }
}

async function refresh(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);

  const token = await createJWT(
    {
      sub: auth.sub,
      email: auth.email,
      role: auth.role,
      premium_level: auth.premium_level,
    },
    env.JWT_SECRET,
  );

  return jsonResponse({ token });
}

async function forgotPassword(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { email: string };
  if (!body.email) return jsonResponse({ error: "Email required" }, 400);

  const result = await env.DB.prepare(
    "SELECT id FROM users WHERE email = ?",
  ).bind(body.email.toLowerCase().trim()).all();

  if (result.results.length === 0) {
    // Don't reveal whether email exists
    return jsonResponse({ message: "If the email exists, a reset link has been sent." });
  }

  const user = result.results[0] as { id: string };
  const resetToken = await generateToken();
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  await env.DB.prepare(
    `INSERT INTO password_resets (id, user_id, token, expires_at)
     VALUES (?, ?, ?, ?)`,
  ).bind(uuid(), user.id, resetToken, expiresAt).run();

  // In production, send email via Resend/SendGrid etc.
  console.log(`Password reset token for ${body.email}: ${resetToken}`);

  return jsonResponse({ message: "If the email exists, a reset link has been sent.", resetToken });
}

async function resetPassword(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { token: string; password: string };

  if (!body.token || !body.password) {
    return jsonResponse({ error: "Token and password required" }, 400);
  }
  if (body.password.length < 8) {
    return jsonResponse({ error: "Password must be at least 8 characters" }, 400);
  }

  const result = await env.DB.prepare(
    `SELECT * FROM password_resets
     WHERE token = ? AND used = 0 AND expires_at > datetime('now')`,
  ).bind(body.token).all<{ id: string; user_id: string }>();

  if (result.results.length === 0) {
    return jsonResponse({ error: "Invalid or expired token" }, 400);
  }

  const reset = result.results[0];
  const passwordHash = await hashPassword(body.password);

  await env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(passwordHash, reset.user_id).run();

  await env.DB.prepare("UPDATE password_resets SET used = 1 WHERE id = ?")
    .bind(reset.id).run();

  return jsonResponse({ message: "Password reset successfully" });
}

async function getMe(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);

  const result = await env.DB.prepare(
    "SELECT id, email, display_name, role, premium_level, premium_expiry, created_at FROM users WHERE id = ?",
  ).bind(auth.sub).all();

  if (result.results.length === 0) {
    return jsonResponse({ error: "User not found" }, 404);
  }

  return jsonResponse(result.results[0]);
}
