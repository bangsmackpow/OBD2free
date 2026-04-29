import { Context } from "./context";
import { handleSessions } from "./routes/sessions";
import { handleUpload } from "./routes/upload";
import { handleAuth } from "./routes/auth";

export interface Env {
  LOGS_BUCKET: R2Bucket;
  DB: D1Database;
  CACHE: KVNamespace;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    };

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Initialize context with environment bindings
      const context = new Context(env);

      // Routes
      if (path === "/api/sessions" && request.method === "GET") {
        return handleSessions(request, context);
      }
      if (path === "/api/sessions" && request.method === "POST") {
        return handleSessions(request, context);
      }
      if (path.startsWith("/api/sessions/") && request.method === "GET") {
        return handleSessions(request, context);
      }
      if (path.startsWith("/api/upload") && request.method === "POST") {
        return handleUpload(request, context);
      }
      if (path === "/api/auth/token" && request.method === "POST") {
        return handleAuth(request, context);
      }

      return new Response("Not Found", { status: 404 });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
