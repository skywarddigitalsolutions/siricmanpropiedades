import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { exportClientsCsv } from "@/lib/api/clients";
import { getSessionToken } from "@/lib/session/dal";

/**
 * `GET /admin/clientes/export?q=` — the clients CSV. The browser never calls
 * the API: this handler checks the session server-side (same as the pages),
 * fetches the back's CSV with the bearer token and streams it through,
 * keeping its `Content-Type` and `Content-Disposition`. It lives under
 * `/admin`, so the proxy gates it behind the session cookie and host routing
 * serves it only on the admin host.
 */
export async function GET(request: Request): Promise<Response> {
  const token = await getSessionToken();
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  let upstream: Response;
  try {
    upstream = await exportClientsCsv(token, q ? { q } : {});
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) redirect("/admin/login?reason=expired");
      if (error.status === 403) return text("No tenés permiso para exportar clientes.", 403);
      return text("No se pudo generar el archivo. Probá de nuevo en unos minutos.", 502);
    }
    throw error;
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("Content-Type") ?? "text/csv; charset=utf-8",
    "Cache-Control": "no-store",
  });
  const disposition = upstream.headers.get("Content-Disposition");
  if (disposition) headers.set("Content-Disposition", disposition);

  return new Response(upstream.body, { status: 200, headers });
}

function text(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
