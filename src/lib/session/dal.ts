import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getMe, logout } from "@/lib/api/auth";
import type { SessionUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { canAccessPanel } from "./roles";
import { getSessionCookie } from "./cookies";

/**
 * Reads the session cookie, redirecting to `/admin/login` when it is absent.
 * The proxy already redirects unauthenticated requests before any Server
 * Component runs (ADR-3), but per ADR-3's own warning ("Always verify
 * authentication and authorization inside each Server Function rather than
 * relying on Proxy alone") this is the actual server-side check.
 */
export async function getSessionToken(): Promise<string> {
  const token = await getSessionCookie();
  if (!token) {
    redirect("/admin/login");
  }
  return token;
}

/**
 * Validates the session against `GET /auth/me` (ADR-7, "Authenticated read
 * and reactive expiry" data flow) and re-applies the panel role gate on every
 * call. Wrapped in `React.cache` so the `(panel)` layout and page can each
 * call it once per request without doubling the outbound `/auth/me` call
 * (ADR-7's rationale) — that per-request memoization is a Next.js server
 * runtime guarantee, not exercised by this project's Vitest harness (see the
 * note at the bottom of `dal.test.ts`).
 *
 * This function runs from Server Components (the `(panel)` layout and page),
 * never from a Server Action or Route Handler, so it deliberately does NOT
 * call `cookies().set()` itself — `next/headers`'s `cookies()` throws
 * "Cookies can only be modified in a Server Action or Route Handler" outside
 * that context (confirmed against the real Next 16 runtime during the
 * Phase 5 manual walkthrough; the unit tests' cookie-store fake did not
 * enforce this constraint, which is why this was only caught there). Per
 * ADR-3's own rationale, the proxy is the single place that clears a stale
 * cookie after a Server Component detects a rejected session: it expires all
 * three cookies whenever `/admin/login` is requested with a `reason` query
 * param (ADR-3 rule 1). Redirecting here with `?reason=expired|forbidden` is
 * therefore sufficient — the browser's next request lands on `/admin/login`
 * with that reason, and the proxy clears the cookies there.
 *
 * - `401` (missing, expired, revoked, or otherwise invalid token) → redirect
 *   to `/admin/login?reason=expired`, letting the proxy clear the session
 *   cookie (Requirement: Server-Side Session Validation).
 * - A role that no longer passes the panel gate → best-effort logout (an API
 *   call, not a cookie write, so it is safe here), then redirect to
 *   `/admin/login?reason=forbidden` for the proxy to clear the cookie
 *   (Requirement: Role Gate for Admin Panel Access — "Role revoked
 *   mid-session").
 * - `ApiError(0)` or another non-401 failure → rethrown, for the `error.tsx`
 *   boundary to render an "unavailable" message; never swallowed here.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser> => {
  const token = await getSessionToken();

  let user: SessionUser;
  try {
    user = await getMe(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/admin/login?reason=expired");
    }
    throw error;
  }

  if (!canAccessPanel(user.roles)) {
    try {
      await logout(token);
    } catch {
      // Best-effort revocation (ADR-6 precedent): the token still expires on its own.
    }
    redirect("/admin/login?reason=forbidden");
  }

  return user;
});
