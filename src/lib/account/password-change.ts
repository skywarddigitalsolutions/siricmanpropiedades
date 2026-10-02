// Pure validation and error mapping for "Mi cuenta" (password change and backup
// codes). Client-safe: used by the forms for instant feedback and by the Server
// Actions, which stay the authority and map the back's English messages.

import { passwordPolicyError } from "@/lib/password-policy";

export type PasswordField = "currentPassword" | "newPassword" | "confirmPassword" | "code";
export type PasswordFieldErrors = Partial<Record<PasswordField, string>>;

export type PasswordFormState = {
  message?: string;
  /** Form-level problem (lockout, service down). */
  error?: string;
  fieldErrors?: PasswordFieldErrors;
};

export type BackupCodesState = {
  /** The new codes; only ever present in the response that created them. */
  codes?: string[];
  error?: string;
  codeError?: string;
};

export type PasswordChangeValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  /** TOTP (6 digits) or backup code (10 characters); empty for accounts without MFA. */
  code: string;
};

export const PASSWORD_CHANGED_MESSAGE =
  "Tu contraseña se actualizó. Se cerraron tus otras sesiones.";
export const LOCKOUT_MESSAGE =
  "Demasiados intentos fallidos. Esperá unos minutos antes de volver a intentar.";

const CODE_FORMAT_MESSAGE = "El código tiene 6 dígitos (app) o 10 caracteres (respaldo).";
const INVALID_CODE_MESSAGE = "El código no es válido. Revisalo e intentá de nuevo.";
const SAME_PASSWORD_MESSAGE = "La nueva contraseña tiene que ser distinta de la actual.";
const PASSWORD_GENERIC_ERROR =
  "No pudimos cambiar la contraseña. Intentá de nuevo en unos minutos.";
const BACKUP_GENERIC_ERROR =
  "No pudimos generar los códigos. Intentá de nuevo en unos minutos.";

/** Field errors for the password-change form, or `undefined` when everything is valid. */
export function validatePasswordChange(
  values: PasswordChangeValues,
): PasswordFieldErrors | undefined {
  const errors: PasswordFieldErrors = {};

  if (!values.currentPassword) {
    errors.currentPassword = "Ingresá tu contraseña actual.";
  }

  if (!values.newPassword) {
    errors.newPassword = "Ingresá la nueva contraseña.";
  } else {
    const policy = passwordPolicyError(values.newPassword);
    if (policy) {
      errors.newPassword = policy;
    } else if (values.newPassword === values.currentPassword) {
      errors.newPassword = SAME_PASSWORD_MESSAGE;
    } else if (values.confirmPassword !== values.newPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden.";
    }
  }

  if (values.code && !/^[a-z0-9]{6,10}$/i.test(values.code)) {
    errors.code = CODE_FORMAT_MESSAGE;
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
}

/** Maps a failed `PATCH /auth/password` (status + the back's messages) to form state. */
export function mapPasswordChangeFailure(status: number, details: string[]): PasswordFormState {
  if (status === 429) return { error: LOCKOUT_MESSAGE };

  if (status === 400) {
    const fieldErrors: PasswordFieldErrors = {};
    for (const detail of details) {
      if (detail === "Current password is incorrect") {
        fieldErrors.currentPassword = "La contraseña actual no es correcta.";
      } else if (detail === "MFA code is required") {
        fieldErrors.code = "Ingresá el código de verificación.";
      } else if (detail === "Invalid code") {
        fieldErrors.code = INVALID_CODE_MESSAGE;
      } else if (detail === "New password must be different from the current one") {
        fieldErrors.newPassword = SAME_PASSWORD_MESSAGE;
      } else if (detail.startsWith("Password must have")) {
        fieldErrors.newPassword = "Tiene que incluir al menos una mayúscula, una minúscula y un número.";
      } else if (detail.startsWith("newPassword")) {
        fieldErrors.newPassword = "La contraseña debe tener entre 6 y 50 caracteres.";
      } else if (detail.startsWith("code")) {
        fieldErrors.code = CODE_FORMAT_MESSAGE;
      }
    }
    if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  }

  return { error: PASSWORD_GENERIC_ERROR };
}

/** The backup-code regeneration needs a fresh 6-digit TOTP (a backup code is not accepted). */
export function validateBackupCodeRequest(code: string): string | undefined {
  return /^\d{6}$/.test(code) ? undefined : "Ingresá los 6 dígitos de tu app de autenticación.";
}

/** Maps a failed `POST /auth/mfa/backup-codes` to form state. */
export function mapBackupCodesFailure(status: number, details: string[]): BackupCodesState {
  if (status === 429) return { error: LOCKOUT_MESSAGE };

  if (status === 400) {
    if (details.includes("Invalid code")) return { codeError: INVALID_CODE_MESSAGE };
    if (details.includes("MFA is not enabled")) {
      return { error: "Tu cuenta no tiene la verificación en dos pasos activada." };
    }
  }

  return { error: BACKUP_GENERIC_ERROR };
}
