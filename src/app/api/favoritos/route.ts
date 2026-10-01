import { ApiError } from "@/lib/api/client";
import { getPublicProperty } from "@/lib/api/public-catalog";
import {
  parseSlugsParam,
  toFavoriteProperty,
  type FavoriteRefresh,
} from "@/lib/favorites/view";

/** The back rate-limits public reads per IP and the web container shares one IP: stay modest. */
const CONCURRENCY = 4;

async function refresh(slug: string): Promise<FavoriteRefresh> {
  try {
    return { slug, status: "ok", property: toFavoriteProperty(await getPublicProperty(slug)) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { slug, status: "gone" };
    // Throttled, down or timed out: say nothing about the property itself.
    return { slug, status: "error" };
  }
}

/**
 * `GET /api/favoritos?slugs=a,b,c` — live data for the visitor's saved
 * properties. The browser only calls this same-origin route (the site CSP keeps
 * `connect-src 'self'`); each detail is read from the public API through the
 * same data cache as the property pages. Only slugs are received, nothing
 * about the visitor.
 */
export async function GET(request: Request): Promise<Response> {
  const parsed = parseSlugsParam(new URL(request.url).searchParams.get("slugs"));
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  const results: FavoriteRefresh[] = new Array(parsed.slugs.length);
  let next = 0;
  const worker = async () => {
    while (next < parsed.slugs.length) {
      const index = next++;
      results[index] = await refresh(parsed.slugs[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, parsed.slugs.length) }, worker));

  return json(results);
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
