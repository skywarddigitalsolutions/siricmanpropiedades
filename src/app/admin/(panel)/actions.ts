"use server";

import { redirect } from "next/navigation";
import { logout } from "@/lib/api/auth";
import { clearAllSessionCookies, getSessionCookie } from "@/lib/session/cookies";

/**
 * `/admin` logout Server Action (Requirement: Logout). Revokes the token on
 * a best-effort basis — a failed or unreachable API call must not prevent
 * the user from logging out locally — then always clears every session
 * cookie and redirects to `/admin/login`. `redirect(...)` is always called
 * outside the `try/catch` that wraps the `logout()` call, per `redirect.md`.
 */
export async function logoutAction(): Promise<void> {
  const token = await getSessionCookie();
  if (token) {
    try {
      await logout(token);
    } catch {
      // Best-effort revocation (ADR-6 precedent): the token still expires on its own.
    }
  }
  await clearAllSessionCookies();
  redirect("/admin/login");
}
