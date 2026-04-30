import { handleAuth } from "./routes/auth";
import { handleSessions } from "./routes/sessions";
import { handleUpload } from "./routes/upload";
import { handleDevices } from "./routes/devices";
import { handleAdmin } from "./routes/admin";
import { handleDocs } from "./routes/docs";
import { handleDTC } from "./routes/dtcs";
import { ensureAdminUser } from "./middleware/setup";
import type { Env } from "./types";

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Expose-Headers": "Content-Length,Content-Disposition",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Ensure admin user exists on first request
      await ensureAdminUser(env);

      const withCors = (response: Response): Response => {
        for (const [key, value] of Object.entries(corsHeaders)) {
          response.headers.set(key, value);
        }
        return response;
      };

      // Health check
      if (path === "/api/health") {
        return withCors(
          new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      // Auth routes
      if (path.startsWith("/api/auth")) {
        return withCors(await handleAuth(request, env));
      }

      // Docs routes
      if (path.startsWith("/api/docs")) {
        return withCors(await handleDocs(request, env));
      }

      // Protected routes
      if (path.startsWith("/api/sessions")) {
        return withCors(await handleSessions(request, env));
      }

      if (path.startsWith("/api/upload")) {
        return withCors(await handleUpload(request, env));
      }

      if (path.startsWith("/api/devices")) {
        return withCors(await handleDevices(request, env));
      }

      if (path.startsWith("/api/admin")) {
        return withCors(await handleAdmin(request, env));
      }

      // DTC lookup routes (public)
      if (path.startsWith("/api/dtc")) {
        return withCors(await handleDTC(request, env));
      }

      return withCors(new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }));
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }
  },
};
