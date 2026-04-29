import { Context } from "../context";

export async function handleAuth(
  request: Request,
  context: Context,
): Promise<Response> {
  const url = new URL(request.url);

  // POST /api/auth/token - Issue device token
  if (request.method === "POST" && url.pathname === "/api/auth/token") {
    return issueToken(request, context);
  }

  // POST /api/auth/refresh - Refresh token
  if (request.method === "POST" && url.pathname === "/api/auth/refresh") {
    return refreshToken(request, context);
  }

  return new Response("Not Found", { status: 404 });
}

async function issueToken(
  _request: Request,
  _context: Context,
): Promise<Response> {
  // In production, this would validate credentials and issue JWT
  // For MVP, return a mock API token
  const token = `obd2free_${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}`;

  return new Response(
    JSON.stringify({
      token,
      expiresIn: 86400 * 30, // 30 days
      tokenType: "Bearer",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function refreshToken(
  request: Request,
  _context: Context,
): Promise<Response> {
  const body = await request.json();
  const refreshToken = body.refreshToken;

  if (!refreshToken) {
    return new Response("Invalid request", { status: 400 });
  }

  // Validate refresh token and issue new access token
  const newToken = `obd2free_${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}`;

  return new Response(
    JSON.stringify({
      token: newToken,
      expiresIn: 86400,
      tokenType: "Bearer",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
