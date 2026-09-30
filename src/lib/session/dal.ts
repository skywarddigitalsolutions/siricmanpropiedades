import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getMe, logout } from "@/lib/api/auth";
import type { SessionUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { canAccessPanel } from "./roles";
import { clearAllSessionCookies, getSessionCookie } from "./cookies";

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
 * - `401` (missing, expired, revoked, or otherwise invalid token) → clear
 *   the session cookie, redirect to `/admin/login?reason=expired`
 *   (Requirement: Server-Side Session Validation).
 * - A role that no longer passes the panel gate → best-effort logout, clear
 *   the cookie, redirect to `/admin/login?reason=forbidden` (Requirement:
 *   Role Gate for Admin Panel Access — "Role revoked mid-session").
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
      await clearAllSessionCookies();
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
    await clearAllSessionCookies();
    redirect("/admin/login?reason=forbidden");
  }

  return user;
});
