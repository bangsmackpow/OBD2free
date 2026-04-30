import { jsonResponse } from "../middleware/setup";
import { getDTCInfo, searchDTCs, getDTCCategories, getDTCsByCategory } from "../data/dtcs";
import type { Env } from "../types";

export async function handleDTC(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // GET /api/dtc/:code — Lookup specific DTC
  if (request.method === "GET" && pathParts.length === 3) {
    const code = pathParts[2].toUpperCase();
    const info = getDTCInfo(code);
    if (!info) {
      return jsonResponse({ error: "DTC code not found", code }, 404);
    }
    return jsonResponse(info);
  }

  // GET /api/dtc?search=keyword — Search DTCs
  if (request.method === "GET" && pathParts.length === 2) {
    const search = url.searchParams.get("search");
    const category = url.searchParams.get("category");

    if (search) {
      const results = searchDTCs(search);
      return jsonResponse({ results, count: results.length, query: search });
    }

    if (category) {
      const results = getDTCsByCategory(category);
      return jsonResponse({ results, count: results.length, category });
    }

    // List all categories
    const categories = getDTCCategories();
    return jsonResponse({ categories, total: Object.keys(getDTCInfo).length || 0 });
  }

  return jsonResponse({ error: "Not found" }, 404);
}
