"use server";

import { redirect } from "next/navigation";
import { isMfaRequired, isMfaSetupRequired, login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { AuthErrorCode } from "@/components/admin/auth/messages";
import { completeSession } from "@/lib/session/complete-session";
import { setMfaPendingCookie, setSetupPendingCookie } from "@/lib/session/cookies";

export type FormState = {
  error?: AuthErrorCode;
  fields?: { userName?: string };
};

/**
 * `/admin/login` Server Action (ADR-6, Data Flow "Login"). Branches on the
 * three `LoginResponse` shapes and, for a full session, applies the shared
 * role gate via `completeSession`. `redirect(...)` is always called outside
 * the `try/catch` that wraps the `login()` call, per `redirect.md`.
 */
export async function loginAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userName = String(formData.get("userName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!userName || !password) {
    return { error: "validation" };
  }

  let response;
  try {
    response = await login(userName, password);
  } catch (error) {
    return { error: mapLoginError(error), fields: { userName } };
  }

  if (isMfaRequired(response)) {
    await setMfaPendingCookie(response.mfaToken);
    redirect("/admin/mfa");
  }

  if (isMfaSetupRequired(response)) {
    await setSetupPendingCookie(response.setupToken);
    redirect("/admin/mfa/setup");
  }

  const result = await completeSession(response);
  if (result === "forbidden") {
    return { error: "no-access" };
  }

  redirect("/admin");
}

function mapLoginError(error: unknown): AuthErrorCode {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 400) {
      return "invalid-credentials";
    }
    if (error.status === 429) {
      return "throttled";
    }
  }
  return "unavailable";
}
