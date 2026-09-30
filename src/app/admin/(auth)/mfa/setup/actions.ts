"use server";

import { redirect } from "next/navigation";
import { confirmMfa, enableMfa } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { AuthErrorCode } from "@/components/admin/auth/messages";
import { renderQrDataUri } from "@/lib/mfa/qr";
import {
  clearSetupPendingCookie,
  getSetupPendingCookie,
} from "@/lib/session/cookies";

export type EnableMfaState =
  | { step: "password"; error?: AuthErrorCode }
  | { step: "scan"; qrSvgDataUri: string; secret: string };

export type ConfirmMfaState =
  | { step: "scan"; error: AuthErrorCode }
  | { step: "codes"; backupCodes: string[] };

/**
 * `AuthService.resolveUserFromToken`/`verifyToken`
 * (back-siricmanpropiedades `src/auth/auth.service.ts`) throw a `401` with
 * one of these exact messages whenever the `setupToken` itself is rejected
 * — expired, malformed/tampered, wrong scope, revoked, or the user is
 * inactive — before either endpoint's own business logic runs.
 * `MfaController`'s `resolveEnrollmentUser` throws the same status for a
 * missing bearer token. Any of these means the enrollment session itself is
 * gone: clear the stale cookie and send the user back to login, exactly
 * like Phase 3's `verifyMfaAction` does for the `mfaToken`.
 */
const TOKEN_REJECTED_MESSAGES = new Set([
  "Invalid or expired token",
  "This token cannot be used for this operation",
  "Token has been revoked",
  "Token not valid",
  "User is not active",
  "Missing authorization token",
]);

/**
 * `MfaService.startEnrollment`/`confirmEnrollment`
 * (back-siricmanpropiedades `src/auth/mfa/mfa.service.ts`) throw these exact
 * `400` messages when there is nothing left for this `setupToken` to do:
 * MFA was already enabled (completed in another tab, or a stale token
 * reused after a prior successful enrollment), or `confirm` was called
 * without a pending `enable` call for this user. Both are treated the same
 * as an expired token.
 */
const NON_RETRYABLE_MESSAGES = new Set([
  "MFA is already enabled",
  "No pending MFA enrollment. Call /auth/mfa/enable first",
]);

type EnrollmentFailure =
  | { kind: "retry"; code: AuthErrorCode }
  | { kind: "expired" };

function classifyEnrollmentError(
  error: unknown,
  wrongInputMessage: string,
  wrongInputCode: AuthErrorCode,
): EnrollmentFailure {
  if (!(error instanceof ApiError)) {
    return { kind: "retry", code: "unavailable" };
  }
  if (error.status === 429) {
    return { kind: "retry", code: "throttled" };
  }
  if (
    (error.status === 401 && TOKEN_REJECTED_MESSAGES.has(error.message)) ||
    (error.status === 400 && NON_RETRYABLE_MESSAGES.has(error.message))
  ) {
    return { kind: "expired" };
  }
  if (error.message === wrongInputMessage) {
    return { kind: "retry", code: wrongInputCode };
  }
  return { kind: "retry", code: "unavailable" };
}

async function requireSetupToken(): Promise<string> {
  const token = await getSetupPendingCookie();
  if (!token) {
    redirect("/admin/login");
  }
  return token;
}

/**
 * `/admin/mfa/setup` password step (ADR-6/ADR-9, Data Flow "Enrollment").
 * Calls `POST /api/auth/mfa/enable` with the `setupToken` cookie and the
 * submitted password. On success, renders the returned `otpauthUrl` as an
 * SVG data URI (`renderQrDataUri`) and advances to the scan step — the raw
 * `otpauthUrl` itself is never sent to the client, only the rendered QR and
 * the secret for manual entry. No session cookie is ever set here.
 */
export async function enableMfaAction(
  password: string,
): Promise<EnableMfaState> {
  const token = await requireSetupToken();

  try {
    const response = await enableMfa(token, password);
    const qrSvgDataUri = await renderQrDataUri(response.otpauthUrl);
    return { step: "scan", qrSvgDataUri, secret: response.secret };
  } catch (error) {
    const failure = classifyEnrollmentError(
      error,
      "Invalid credentials",
      "invalid-password",
    );
    if (failure.kind === "expired") {
      await clearSetupPendingCookie();
      redirect("/admin/login?reason=expired");
    }
    return { step: "password", error: failure.code };
  }
}

/**
 * `/admin/mfa/setup` confirmation step. Calls `POST /api/auth/mfa/confirm`
 * with the `setupToken` cookie and the submitted TOTP code. On success it
 * returns the one-time backup codes and does NOT touch any cookie: modifying
 * a cookie in a Server Action makes Next re-render `/admin/mfa/setup`, whose
 * guard would then redirect before the codes are shown. The `setupToken`
 * cookie is cleared by `finishEnrollmentAction` once the user acknowledges
 * the codes. Per `design.md`, no session cookie is ever set from this flow —
 * the user must complete a normal MFA-verified login afterward.
 */
export async function confirmMfaAction(
  code: string,
): Promise<ConfirmMfaState> {
  const token = await requireSetupToken();

  try {
    const response = await confirmMfa(token, code);
    return { step: "codes", backupCodes: response.backupCodes };
  } catch (error) {
    const failure = classifyEnrollmentError(error, "Invalid code", "invalid-code");
    if (failure.kind === "expired") {
      await clearSetupPendingCookie();
      redirect("/admin/login?reason=expired");
    }
    return { step: "scan", error: failure.code };
  }
}

/**
 * Final enrollment step: runs after the user acknowledges the backup codes.
 * Enrollment is already complete on the back, so the leftover `setupToken`
 * is useless (`enable` would answer 400 "MFA is already enabled"); it is
 * cleared here and the user is sent to a normal MFA-verified login.
 */
export async function finishEnrollmentAction(): Promise<void> {
  await clearSetupPendingCookie();
  redirect("/admin/login");
}
