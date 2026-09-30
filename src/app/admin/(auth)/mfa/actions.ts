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
 * back-siricmanpropiedades's `MfaController.verify`
 * (`src/auth/mfa/mfa.controller.ts`) throws this exact message for a wrong
 * TOTP/backup code — the mfaToken itself is still valid in that case (it is
 * only revoked on a *correct* code, see that controller's `verify` method).
 * Every other rejection means the token itself was refused before the code
 * was even checked (`AuthService.resolveUserFromToken`/`verifyToken` in
 * `src/auth/auth.service.ts`: wrong scope, revoked, not found, inactive
 * user, or a JWT that failed to verify — expired, malformed, or tampered).
 */
const WRONG_CODE_MESSAGE = "Invalid code";

/**
 * `/admin/mfa` Server Action (ADR-6, Data Flow "Login"). Reads the pending
 * `mfaToken` cookie set by `loginAction`.
 *
 * `verifyMfa` rejects with `401` and the exact message `"Invalid code"` for
 * a wrong code — the mfaToken itself is still valid, so the pending cookie
 * is left intact for a retry within its remaining lifetime. Any other
 * rejection (a different 401 message, or any other status) means the
 * mfaToken itself was rejected (expired, invalid, revoked, or already
 * consumed): the stale cookie is cleared and the user is sent back to
 * `/admin/login?reason=expired`. `redirect(...)` is always called outside
 * the `try/catch` that wraps the `verifyMfa()` call.
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
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      error.message === WRONG_CODE_MESSAGE
    ) {
      return { error: "invalid-code" };
    }
    await clearMfaPendingCookie();
    redirect("/admin/login?reason=expired");
  }

  const result = await completeSession(response);
  await clearMfaPendingCookie();
  if (result === "forbidden") {
    return { error: "no-access" };
  }

  redirect("/admin");
}
