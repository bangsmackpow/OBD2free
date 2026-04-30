import { jsonResponse } from "../middleware/setup";
import type { Env } from "../types";

export async function handleDocs(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.replace("/api/docs", "").split("/").filter(Boolean);

  // GET /api/docs - List available docs
  if (request.method === "GET" && pathParts.length === 0) {
    return listDocs(env);
  }

  // GET /api/docs/:slug - Get a doc page
  if (request.method === "GET" && pathParts.length >= 1) {
    return getDoc(pathParts.join("/"), env);
  }

  // PUT /api/docs/:slug - Upsert a doc (admin only - handled by admin routes)
  if (request.method === "PUT") {
    return upsertDoc(request, env);
  }

  return jsonResponse({ error: "Not found" }, 404);
}

async function listDocs(env: Env): Promise<Response> {
  try {
    const objects = await env.DOCS_BUCKET.list({ prefix: "docs/" });
    const docs = objects.objects
      .filter((o) => o.key.endsWith(".md"))
      .map((o) => ({
        slug: o.key.replace("docs/", "").replace(".md", ""),
        size: o.size,
        uploaded: o.uploaded,
      }));

    return jsonResponse({ docs });
  } catch {
    return jsonResponse({ docs: [] });
  }
}

async function getDoc(slug: string, env: Env): Promise<Response> {
  try {
    const key = `docs/${slug}.md`;
    const obj = await env.DOCS_BUCKET.get(key);

    if (!obj) {
      // Try index file for directory-style paths
      const indexKey = `docs/${slug}/index.md`;
      const indexObj = await env.DOCS_BUCKET.get(indexKey);
      if (!indexObj) {
        return jsonResponse({ error: "Document not found" }, 404);
      }
      const content = await indexObj.text();
      return jsonResponse({ slug, content, key: indexKey });
    }

    const content = await obj.text();
    return jsonResponse({ slug, content, key });
  } catch {
    return jsonResponse({ error: "Document not found" }, 404);
  }
}

async function upsertDoc(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { slug: string; content: string };
    if (!body.slug || !body.content) {
      return jsonResponse({ error: "Slug and content required" }, 400);
    }

    const key = `docs/${body.slug}.md`;
    await env.DOCS_BUCKET.put(key, body.content, {
      customMetadata: { updatedAt: new Date().toISOString() },
    });

    return jsonResponse({ slug: body.slug, key }, 200);
  } catch {
    return jsonResponse({ error: "Failed to save document" }, 500);
  }
}
