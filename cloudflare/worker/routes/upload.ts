import { Context } from "../context";

export async function handleUpload(
  request: Request,
  context: Context,
): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // POST /api/upload/:sessionId - Upload log file for session
  if (request.method === "POST" && pathParts.length === 3) {
    const sessionId = pathParts[2];
    return uploadSessionFile(request, context, sessionId);
  }

  // GET /api/upload/:sessionId/presigned - Get presigned URL (legacy, not used)
  if (
    request.method === "GET" &&
    pathParts.length === 4 &&
    pathParts[3] === "presigned"
  ) {
    const sessionId = pathParts[2];
    return getPresignedUrl(request, context, sessionId);
  }

  return new Response("Not Found", { status: 404 });
}

async function uploadSessionFile(
  request: Request,
  context: Context,
  sessionId: string,
): Promise<Response> {
  // Authenticate
  const userId = await authenticateRequest(request);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify session belongs to user
  const sessionCheck = await context.query(
    `SELECT id FROM sessions WHERE id = ? AND user_id = ?`,
    [sessionId, userId],
  );

  if (sessionCheck.results.length === 0) {
    return new Response("Session not found or unauthorized", { status: 404 });
  }

  // Get file body
  const body = await request.body;

  // Determine file key
  const r2Key = `sessions/${sessionId}/session_${sessionId}.csv`;
  const contentLength = request.headers.get("Content-Length");

  // Save to R2
  try {
    await context.putR2Object(
      r2Key,
      body,
      contentLength ? parseInt(contentLength) : undefined,
    );

    // Update session metadata with file key and size
    await context.exec(
      `UPDATE sessions SET file_key = ?, file_size = ?, uploaded_at = ? WHERE id = ?`,
      [r2Key, contentLength, new Date().toISOString(), sessionId],
    );

    // Invalidate cache
    await context.deleteCache(`session_${sessionId}`);

    return new Response(JSON.stringify({ success: true, key: r2Key }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response("Upload failed", { status: 500 });
  }
}

async function getPresignedUrl(
  _request: Request,
  _context: Context,
  sessionId: string,
): Promise<Response> {
  // Cloudflare R2 does not support presigned URLs natively.
  // This endpoint is kept for compatibility but not used in Cloudflare architecture.
  // Instead, clients upload directly to /api/upload/:sessionId

  const uploadUrl = `/api/upload/${sessionId}`;

  return new Response(
    JSON.stringify({
      url: uploadUrl,
      method: "PUT",
      fields: {},
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function authenticateRequest(request: Request): Promise<string | null> {
  const auth = request.headers.get("Authorization");
  if (!auth) return null;

  const token = auth.replace("Bearer ", "");
  // In production, verify JWT or API token
  // For MVP, accept any non-empty token and map to user
  return token ? "user_001" : null;
}
