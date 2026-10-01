import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  MFA_PENDING_COOKIE,
  SESSION_COOKIE,
  SETUP_PENDING_COOKIE,
  cookieName,
  cookiePath,
} from "@/lib/session/cookie-names";
import { buildCsp, getImgSources } from "@/lib/security/headers";
import { decideHostRouting, isAdminPath } from "@/lib/security/host-routing";
import { getSiteUrl } from "@/lib/site-url";

// `src/proxy.ts` is the Next.js 16 rename of `middleware.ts` (ADR-3). It does
// a cookie-presence check only — no JWT verification — so it cannot import
// anything tagged `server-only`; it stays intentionally self-contained and
// only imports plain modules (`cookie-names`, `security/*`, `site-url`).
//
// Besides auth gating it (1) routes between the public host and the admin
// host when `ADMIN_URL` is set and (2) sets the per-request CSP.

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
    path: cookiePath(),
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  };
}

function generateNonce(): string {
  return btoa(crypto.randomUUID());
}

/**
 * Pass-through response carrying the security headers. Admin pages are always
 * dynamic (cookie-gated), so they get a nonce CSP (`'strict-dynamic'`); public
 * pages mix static and dynamic rendering, and a nonce would force every one of
 * them dynamic, so they use `'unsafe-inline'` for scripts. The CSP also goes on
 * the request headers: Next reads the nonce from there to tag its own scripts.
 */
function nextWithSecurityHeaders(request: NextRequest): NextResponse {
  const isAdmin = isAdminPath(request.nextUrl.pathname);
  const nonce = isAdmin ? generateNonce() : undefined;
  const csp = buildCsp({
    nonce,
    isAdmin,
    isDev: process.env.NODE_ENV === "development",
    imgSources: getImgSources({
      isDev: process.env.NODE_ENV === "development",
      siteUrl: process.env.SITE_URL,
      mediaOrigin: process.env.MEDIA_ORIGIN,
    }),
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", csp);
  if (nonce) requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", isAdmin ? "DENY" : "SAMEORIGIN");
  return response;
}

/** Redirect inside the admin, anchored to `ADMIN_URL` when set (behind the proxy `request.url` may carry the internal host). */
function adminRedirect(request: NextRequest, path: string): NextResponse {
  const base = process.env.ADMIN_URL?.trim() || request.url;
  return NextResponse.redirect(new URL(path, base));
}

/**
 * Proxy order:
 * 0. Host routing (only when `ADMIN_URL` is set): see `decideHostRouting`.
 * 1. Non-admin paths → pass through with the security headers.
 * Admin paths, cookie presence only (ADR-3):
 * 2. `/admin/login?reason=expired|forbidden` → pass through, expire all 3 cookies.
 * 3. Session cookie present + target `/admin/login` (no `reason`) → redirect `/admin`.
 * 4. No session cookie + protected path → redirect `/admin/login`.
 * 5. Otherwise → pass through.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search, searchParams } = request.nextUrl;

  const decision = decideHostRouting({
    host:
      request.headers.get("x-forwarded-host") ??
      request.headers.get("host") ??
      request.nextUrl.host,
    pathname,
    search,
    adminUrl: process.env.ADMIN_URL,
    siteUrl: getSiteUrl(),
  });
  if (decision.action === "redirect") {
    return NextResponse.redirect(decision.url, 308);
  }

  if (!isAdminPath(pathname)) {
    return nextWithSecurityHeaders(request);
  }

  const hasSessionCookie = request.cookies.has(cookieName(SESSION_COOKIE));
  const reason = searchParams.get("reason");

  if (
    pathname === LOGIN_PATH &&
    (reason === "expired" || reason === "forbidden")
  ) {
    const response = nextWithSecurityHeaders(request);
    const options = expiredCookieOptions();
    response.cookies.set(cookieName(SESSION_COOKIE), "", options);
    response.cookies.set(cookieName(MFA_PENDING_COOKIE), "", options);
    response.cookies.set(cookieName(SETUP_PENDING_COOKIE), "", options);
    return response;
  }

  if (pathname === LOGIN_PATH && hasSessionCookie) {
    return adminRedirect(request, "/admin");
  }

  if (!PUBLIC_AUTH_PATHS.has(pathname) && !hasSessionCookie) {
    return adminRedirect(request, LOGIN_PATH);
  }

  return nextWithSecurityHeaders(request);
}

export const config = {
  // Everything except Next internals and the favicon: host routing and the
  // CSP need to see site pages too, not only `/admin`.
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
