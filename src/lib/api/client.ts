import "server-only";
import { headers } from "next/headers";
import { getClientIp } from "./client-ip";

/**
 * Thrown by `apiFetch` for any non-2xx response, or `status: 0` for a
 * network failure or timeout (per ADR-5). Callers in `src/lib/session/*`
 * decide what a given status means (invalid credentials, expired session,
 * throttled, unavailable, ...). `details` carries every message the back
 * returned (Nest's default error body is `{ statusCode, message, error }`,
 * where `message` is a string or a string array) so forms can map field
 * errors; it defaults to a single-item array of `message` when the caller
 * (or a non-validation failure) only has one message to report.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details: string[] = [message],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
  /** Overrides the default timeout (10s JSON, 60s multipart uploads). */
  timeoutMs?: number;
  /**
   * Seconds to keep the response in Next's data cache (public catalog reads).
   * A cached response is shared by every visitor, so no visitor IP is
   * forwarded in that case; without it the request is never cached.
   */
  revalidate?: number;
};

const REQUEST_TIMEOUT_MS = 10_000;
const MULTIPART_TIMEOUT_MS = 60_000;

/**
 * Server-only fetch wrapper for the internal API (per ADR-5). Composes
 * `${API_INTERNAL_URL}/api<path>`, attaches the bearer token when provided,
 * forwards the real client IP as `X-Forwarded-For` (per ADR-4), and disables
 * caching unless `revalidate` opts into Next's data cache (shared public
 * reads, sent without a client IP). Non-2xx responses and network
 * failures/timeouts are normalized into `ApiError`.
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

  const isFormData =
    typeof FormData !== "undefined" && opts.body instanceof FormData;

  const requestHeaders: Record<string, string> = {};
  if (!isFormData) {
    // Multipart bodies keep no Content-Type here: fetch sets it (with the
    // boundary) itself when the body is a FormData instance.
    requestHeaders["Content-Type"] = "application/json";
  }
  if (opts.token) {
    requestHeaders.Authorization = `Bearer ${opts.token}`;
  }

  const cached = opts.revalidate !== undefined;
  if (!cached) {
    const clientIp = getClientIp(await headers());
    if (clientIp) {
      requestHeaders["X-Forwarded-For"] = clientIp;
    }
  }

  const timeoutMs =
    opts.timeoutMs ?? (isFormData ? MULTIPART_TIMEOUT_MS : REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: opts.method ?? "GET",
      headers: requestHeaders,
      body:
        opts.body === undefined
          ? undefined
          : isFormData
            ? (opts.body as FormData)
            : JSON.stringify(opts.body),
      ...(cached
        ? { next: { revalidate: opts.revalidate } }
        : { cache: "no-store" as const }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new ApiError(0, "No se pudo contactar al servicio.");
  }

  if (!response.ok) {
    const { message, details } = await extractErrorMessage(response);
    throw new ApiError(response.status, message, details);
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

async function extractErrorMessage(
  response: Response,
): Promise<{ message: string; details: string[] }> {
  try {
    const body: unknown = await response.json();
    const message = (body as { message?: unknown } | null)?.message;
    if (typeof message === "string") {
      return { message, details: [message] };
    }
    if (Array.isArray(message)) {
      const details = message.filter(
        (item): item is string => typeof item === "string",
      );
      if (details.length > 0) {
        return { message: details.join(", "), details };
      }
    }
  } catch {
    // Response body was not JSON; fall through to a generic message.
  }
  const fallback =
    response.statusText || `Request failed with status ${response.status}`;
  return { message: fallback, details: [fallback] };
}
