import { getSessionCookie } from "@/lib/session/cookies";
import { sanitizeAddressQuery } from "@/lib/usig/address";
import {
  lookupBarrio,
  searchAddresses,
  UsigUnavailableError,
} from "@/lib/usig/usig-client";

/**
 * `GET /admin/api/direcciones?q=` — CABA address suggestions, and
 * `?lat=&lon=` — the barrio for a point. The browser only ever calls this
 * same-origin endpoint (the admin CSP keeps `connect-src 'self'`); USIG is
 * called from here, behind the session cookie, with a short timeout. A USIG
 * outage answers 200 with `unavailable: true` so the editor can still save.
 */
export async function GET(request: Request): Promise<Response> {
  if (!(await getSessionCookie())) {
    return json({ error: "No autenticado." }, 401);
  }

  const params = new URL(request.url).searchParams;

  if (params.has("lat") || params.has("lon")) {
    const lat = Number(params.get("lat"));
    const lon = Number(params.get("lon"));
    if (
      !params.get("lat") ||
      !params.get("lon") ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      Math.abs(lat) > 90 ||
      Math.abs(lon) > 180
    ) {
      return json({ error: "Coordenadas inválidas." }, 400);
    }
    try {
      return json({ barrio: await lookupBarrio(lat, lon) });
    } catch (error) {
      if (error instanceof UsigUnavailableError) {
        return json({ barrio: null, unavailable: true });
      }
      throw error;
    }
  }

  if (!params.has("q")) return json({ error: "Falta la consulta." }, 400);

  const query = sanitizeAddressQuery(params.get("q"));
  if (!query) return json({ suggestions: [] });

  try {
    return json({ suggestions: await searchAddresses(query) });
  } catch (error) {
    if (error instanceof UsigUnavailableError) {
      return json({ suggestions: [], unavailable: true });
    }
    throw error;
  }
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
