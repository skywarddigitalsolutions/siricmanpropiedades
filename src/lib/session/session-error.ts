import "server-only";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";

/**
 * Shared handling for an error raised by an authenticated API call: a `401`
 * means the token is missing/expired/revoked, so redirect to
 * `/admin/login?reason=expired` for the proxy to clear the stale cookie
 * (ADR-3) — the same handling `dal.ts`'s `getCurrentUser` applies to
 * `/auth/me`. Any other error is rethrown for the caller (or `error.tsx`) to
 * handle. Extracted so every page that calls the admin API with the session
 * token (starting with the property list, feature 6 T3) reuses this instead
 * of duplicating the 401 check.
 */
export function handleSessionError(error: unknown): never {
  if (error instanceof ApiError && error.status === 401) {
    redirect("/admin/login?reason=expired");
  }
  throw error;
}

/**
 * Like `handleSessionError`, but a network failure (`status: 0`) or a 5xx
 * returns so the page can render an "unavailable" message instead of the
 * error boundary. A 401 still redirects; anything else is rethrown.
 */
export function handleUnlessUnavailable(error: unknown): void {
  const status = (error as { status?: number } | null)?.status;
  if (status === 0 || (status !== undefined && status >= 500)) return;
  handleSessionError(error);
}
