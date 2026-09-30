import "server-only";
import { headers } from "next/headers";
import { getClientIp } from "./client-ip";

/**
 * Thrown by `apiFetch` for any non-2xx response, or `status: 0` for a
 * network failure or timeout (per ADR-5). Callers in `src/lib/session/*`
 * decide what a given status means (invalid credentials, expired session,
 * throttled, unavailable, ...).
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiFetchOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  token?: string;
};

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Server-only fetch wrapper for the internal API (per ADR-5). Composes
 * `${API_INTERNAL_URL}/api<path>`, attaches the bearer token when provided,
 * forwards the real client IP as `X-Forwarded-For` (per ADR-4), and always
 * disables caching. Non-2xx responses and network failures/timeouts are
 * normalized into `ApiError`.
 */
export async function apiFetch<T = unknown>(
  path: `/${string}`,
  opts: ApiFetchOptions = {},
): Promise<T> {
  const baseUrl = process.env.API_INTERNAL_URL;
  if (!baseUrl) {
    throw new Error("API_INTERNAL_URL is not configured");
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api${path}`;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.token) {
    requestHeaders.Authorization = `Bearer ${opts.token}`;
  }

  const clientIp = getClientIp(await headers());
  if (clientIp) {
    requestHeaders["X-Forwarded-For"] = clientIp;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: opts.method ?? "GET",
      headers: requestHeaders,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(0, "No se pudo contactar al servicio.");
  }

  if (!response.ok) {
    throw new ApiError(response.status, await extractErrorMessage(response));
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    const message = (body as { message?: unknown } | null)?.message;
    if (typeof message === "string") {
      return message;
    }
    if (Array.isArray(message)) {
      return message.join(", ");
    }
  } catch {
    // Response body was not JSON; fall through to a generic message.
  }
  return response.statusText || `Request failed with status ${response.status}`;
}
