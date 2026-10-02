"use server";

import { ApiError } from "@/lib/api/client";
import { changePassword, regenerateBackupCodes } from "@/lib/api/auth";
import {
  PASSWORD_CHANGED_MESSAGE,
  mapBackupCodesFailure,
  mapPasswordChangeFailure,
  validateBackupCodeRequest,
  validatePasswordChange,
  type BackupCodesState,
  type PasswordFormState,
} from "@/lib/account/password-change";
import { setSessionCookie } from "@/lib/session/cookies";
import { getSessionToken } from "@/lib/session/dal";
import { handleSessionError } from "@/lib/session/session-error";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * `/admin/cuenta` change-password Server Action. The back closes every other
 * session and answers with a fresh token for this one, so the BFF cookie is
 * swapped for it; otherwise the user would be logged out by their own change.
 * Passwords are never trimmed or echoed back.
 */
export async function changePasswordAction(
  _prevState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const currentPassword = text(formData, "currentPassword");
  const newPassword = text(formData, "newPassword");
  const code = text(formData, "code").trim();

  const fieldErrors = validatePasswordChange({
    currentPassword,
    newPassword,
    confirmPassword: text(formData, "confirmPassword"),
    code,
  });
  if (fieldErrors) return { fieldErrors };

  const token = await getSessionToken();
  let session;
  try {
    session = await changePassword(token, {
      currentPassword,
      newPassword,
      // Backup codes are lowercase hex; a TOTP is digits, so lowercasing is safe.
      ...(code ? { code: code.toLowerCase() } : {}),
    });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 401) handleSessionError(error);
    return mapPasswordChangeFailure(error.status, error.details);
  }

  await setSessionCookie(session.token);
  return { message: PASSWORD_CHANGED_MESSAGE };
}

/** `/admin/cuenta` regenerate-backup-codes Server Action: needs a current TOTP; codes come back once. */
export async function regenerateBackupCodesAction(
  _prevState: BackupCodesState,
  formData: FormData,
): Promise<BackupCodesState> {
  const code = text(formData, "code").trim();
  const codeError = validateBackupCodeRequest(code);
  if (codeError) return { codeError };

  const token = await getSessionToken();
  try {
    const { backupCodes } = await regenerateBackupCodes(token, code);
    return { codes: backupCodes };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 401) handleSessionError(error);
    return mapBackupCodesFailure(error.status, error.details);
  }
}
