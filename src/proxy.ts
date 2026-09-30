import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_COOKIE_PATH,
  MFA_PENDING_COOKIE,
  SESSION_COOKIE,
  SETUP_PENDING_COOKIE,
} from "@/lib/session/cookie-names";

// `src/proxy.ts` is the Next.js 16 rename of `middleware.ts` (ADR-3). It does
// a cookie-presence check only — no JWT verification — so it cannot import
// anything tagged `server-only`; it stays intentionally self-contained and
// only imports the plain `cookie-names` constants.

const LOGIN_PATH = "/admin/login";
const PUBLIC_AUTH_PATHS = new Set([
  LOGIN_PATH,
  "/admin/mfa",
  "/admin/mfa/setup",
]);

/** Same shape as `cookieOptions(0)` in `src/lib/session/cookies.ts`, inlined so the proxy needs no `server-only` import. */
function expiredCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: ADMIN_COOKIE_PATH,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  };
}

/**
 * Route-protection proxy (Requirement: Route Protection Middleware). Cookie
 * presence only, in this order (ADR-3):
 * 1. `/admin/login?reason=expired|forbidden` → pass through, expire all 3 cookies.
 * 2. Session cookie present + target `/admin/login` (no `reason`) → redirect `/admin`.
 * 3. No session cookie + protected path → redirect `/admin/login`.
 * 4. Otherwise → pass through.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, searchParams } = request.nextUrl;
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);
  const reason = searchParams.get("reason");

  if (
    pathname === LOGIN_PATH &&
    (reason === "expired" || reason === "forbidden")
  ) {
    const response = NextResponse.next();
    const options = expiredCookieOptions();
    response.cookies.set(SESSION_COOKIE, "", options);
    response.cookies.set(MFA_PENDING_COOKIE, "", options);
    response.cookies.set(SETUP_PENDING_COOKIE, "", options);
    return response;
  }

  if (pathname === LOGIN_PATH && hasSessionCookie) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (!PUBLIC_AUTH_PATHS.has(pathname) && !hasSessionCookie) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
