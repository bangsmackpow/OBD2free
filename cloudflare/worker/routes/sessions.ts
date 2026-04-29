import { Context } from "../context";

export async function handleSessions(
  request: Request,
  context: Context,
): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // GET /api/sessions - List user's sessions
  if (request.method === "GET" && pathParts.length === 2) {
    return listSessions(request, context);
  }

  // POST /api/sessions - Create session metadata
  if (request.method === "POST" && pathParts.length === 2) {
    return createSession(request, context);
  }

  // GET /api/sessions/:id - Get session details
  if (request.method === "GET" && pathParts.length === 3) {
    const sessionId = pathParts[2];
    return getSession(sessionId, context);
  }

  // GET /api/sessions/:id/data - Stream log data
  if (
    request.method === "GET" &&
    pathParts.length === 4 &&
    pathParts[3] === "data"
  ) {
    const sessionId = pathParts[2];
    return streamSessionData(sessionId, context);
  }

  return new Response("Not Found", { status: 404 });
}

async function listSessions(
  _request: Request,
  context: Context,
): Promise<Response> {
  // TODO: Add authentication via Authorization header
  const userId = "user_001"; // Mock user

  const result = await context.query(
    `SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
  );

  return new Response(JSON.stringify(result.results), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function createSession(
  request: Request,
  context: Context,
): Promise<Response> {
  // TODO: Authenticate user
  const userId = "user_001";
  const body = await request.json();

  const sessionId = body.sessionId || crypto.randomUUID();
  const now = new Date().toISOString();

  const result = await context.exec(
    `INSERT INTO sessions (id, user_id, vehicle_id, started_at, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sessionId, userId, body.vehicleId, now, body.notes || "", now],
  );

  return new Response(
    JSON.stringify({ id: sessionId, success: result.success }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function getSession(
  sessionId: string,
  context: Context,
): Promise<Response> {
  // TODO: Authenticate user
  const userId = "user_001";

  const result = await context.query(
    `SELECT * FROM sessions WHERE id = ? AND user_id = ?`,
    [sessionId, userId],
  );

  if (result.results.length === 0) {
    return new Response("Session not found", { status: 404 });
  }

  return new Response(JSON.stringify(result.results[0]), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function streamSessionData(
  sessionId: string,
  context: Context,
): Promise<Response> {
  // Get session metadata
  const sessionResult = await context.query(
    `SELECT * FROM sessions WHERE id = ?`,
    [sessionId],
  );

  if (sessionResult.results.length === 0) {
    return new Response("Session not found", { status: 404 });
  }

  const session = sessionResult.results[0];

  // Construct R2 key
  const key =
    session.file_key || `sessions/${sessionId}/session_${sessionId}.csv`;

  // Get object from R2
  const obj = await context.getR2Object(key);

  if (!obj || !obj.body) {
    return new Response("Log file not found", { status: 404 });
  }

  // Stream response
  return new Response(obj.body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="session_${sessionId}.csv"`,
    },
  });
}
