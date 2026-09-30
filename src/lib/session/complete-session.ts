import "server-only";
import { logout } from "@/lib/api/auth";
import type { FullSessionResponse } from "@/lib/api/auth";
import { canAccessPanel } from "./roles";
import {
  clearMfaPendingCookie,
  clearAllSessionCookies,
  setSessionCookie,
  clearSetupPendingCookie,
} from "./cookies";

/**
 * Login state machine's shared role gate (ADR-6). Runs on every path that
 * produces a full session (first-factor login, MFA verify).
 *
 * - Role gate passes (`admin`/`manager`): set the session cookie, clear the
 *   pending cookies, return `"ok"`.
 * - Role gate fails (e.g. `user`): revoke the token on a best-effort basis
 *   (errors swallowed — the token still dies within its own lifetime), clear
 *   every cookie, and return `"forbidden"`. The session cookie is never set.
 */
export async function completeSession(
  session: FullSessionResponse,
): Promise<"ok" | "forbidden"> {
  if (canAccessPanel(session.roles)) {
    await setSessionCookie(session.token);
    await clearMfaPendingCookie();
    await clearSetupPendingCookie();
    return "ok";
  }

  try {
    await logout(session.token);
  } catch {
    // Best-effort revocation (ADR-6): the token still expires on its own.
  }
  await clearAllSessionCookies();
  return "forbidden";
}
