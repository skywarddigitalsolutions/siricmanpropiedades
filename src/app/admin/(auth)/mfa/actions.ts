"use server";

import { redirect } from "next/navigation";
import { verifyMfa } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { AuthErrorCode } from "@/components/admin/auth/messages";
import { completeSession } from "@/lib/session/complete-session";
import {
  clearMfaPendingCookie,
  getMfaPendingCookie,
} from "@/lib/session/cookies";

export type FormState = {
  error?: AuthErrorCode;
};

/**
 * `/admin/mfa` Server Action (ADR-6, Data Flow "Login"). Reads the pending
 * `mfaToken` cookie set by `loginAction`.
 *
 * `verifyMfa` rejects with `401` for a wrong code (the mfaToken itself is
 * still valid, so the pending cookie is left intact for a retry within its
 * remaining lifetime) and with any other status for an mfaToken that is
 * expired, invalid, or already consumed (the stale cookie is cleared and the
 * user is sent back to `/admin/login`). `redirect(...)` is always called
 * outside the `try/catch` that wraps the `verifyMfa()` call.
 */
export async function verifyMfaAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const mfaToken = await getMfaPendingCookie();
  if (!mfaToken) {
    redirect("/admin/login");
  }

  const code = String(formData.get("code") ?? "").trim();
  if (!code) {
    return { error: "validation" };
  }

  let response;
  try {
    response = await verifyMfa(mfaToken, code);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { error: "invalid-code" };
    }
    await clearMfaPendingCookie();
    redirect("/admin/login");
  }

  const result = await completeSession(response);
  await clearMfaPendingCookie();
  if (result === "forbidden") {
    return { error: "no-access" };
  }

  redirect("/admin");
}
