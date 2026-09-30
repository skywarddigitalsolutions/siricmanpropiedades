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

/** All three admin session cookies are scoped to `/admin`. */
export const ADMIN_COOKIE_PATH = "/admin";

/** Seconds. Matches the API's 60-minute JWT lifetime. */
export const SESSION_MAX_AGE = 3600;

/** Seconds. Matches the API's 5-minute `mfaToken` lifetime. */
export const MFA_PENDING_MAX_AGE = 300;

/** Seconds. Matches the API's 15-minute `setupToken` lifetime. */
export const SETUP_PENDING_MAX_AGE = 900;
