// Session cookie names, path, and lifetimes (ADR-2).
//
// No `server-only` import: `src/proxy.ts` (the Next.js 16 proxy runtime, see
// ADR-3) also needs these constants, and `proxy.ts` cannot import a
// `server-only`-tagged module.

/** Full-session bearer JWT (60-minute lifetime, matching the API's JWT). */
export const SESSION_COOKIE = "siricman_admin_session";

/** Pending `mfaToken` (`mfa_verify` scope), set after login when MFA is enabled. */
export const MFA_PENDING_COOKIE = "siricman_admin_mfa";

/** Pending `setupToken` (`mfa_setup` scope), set after login when MFA enrollment is required. */
export const SETUP_PENDING_COOKIE = "siricman_admin_setup";

/** Cookie path outside production. Production uses `/` (see `cookiePath`). */
export const ADMIN_COOKIE_PATH = "/admin";

/**
 * In production the admin lives on its own host (`ADMIN_URL`) and the cookies
 * are host-only (no `Domain`), so the public site never receives them. The
 * `__Host-` prefix makes browsers enforce that: `Secure`, `Path=/`, no
 * `Domain`. Localhost over HTTP cannot use the prefix, so dev keeps the plain
 * names and the `/admin` path.
 */
export function cookieName(baseName: string): string {
  return process.env.NODE_ENV === "production" ? `__Host-${baseName}` : baseName;
}

/** `/` in production (required by `__Host-`), `/admin` otherwise. */
export function cookiePath(): string {
  return process.env.NODE_ENV === "production" ? "/" : ADMIN_COOKIE_PATH;
}

/** Seconds. Matches the API's 60-minute JWT lifetime. */
export const SESSION_MAX_AGE = 3600;

/** Seconds. Matches the API's 5-minute `mfaToken` lifetime. */
export const MFA_PENDING_MAX_AGE = 300;

/** Seconds. Matches the API's 15-minute `setupToken` lifetime. */
export const SETUP_PENDING_MAX_AGE = 900;
