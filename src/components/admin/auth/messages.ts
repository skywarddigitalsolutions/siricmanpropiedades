// Neutral-Spanish copy for the admin auth flows (ADR-8). Centralized here so
// every Server Action and form component maps the same `AuthErrorCode` to
// the same visible text.

export type AuthErrorCode =
  | "invalid-credentials"
  | "throttled"
  | "no-access"
  | "invalid-code"
  | "invalid-password"
  | "unavailable"
  | "validation";

/** `?reason=` values the login page can receive from the proxy or a redirect (ADR-3/ADR-6). */
export type SessionNotice = "expired" | "forbidden";

const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  "invalid-credentials": "Usuario o contraseña incorrectos.",
  throttled: "Demasiados intentos. Espere unos minutos e intente nuevamente.",
  "no-access": "Esta cuenta no tiene acceso al panel de administración.",
  "invalid-code":
    "El código no es válido. Si el problema continúa, vuelva a iniciar sesión.",
  "invalid-password":
    "La contraseña no es correcta o la verificación expiró.",
  unavailable:
    "El servicio no está disponible. Intente nuevamente en unos minutos.",
  validation: "Complete todos los campos.",
};

/** Exact neutral-Spanish message for a given `AuthErrorCode` (ADR-8's mapping table). */
export function getAuthErrorMessage(code: AuthErrorCode): string {
  return AUTH_ERROR_MESSAGES[code];
}

const SESSION_NOTICE_MESSAGES: Record<SessionNotice, string> = {
  expired: "Su sesión expiró. Inicie sesión nuevamente.",
  forbidden: AUTH_ERROR_MESSAGES["no-access"],
};

/** Notice text for `/admin/login?reason=expired|forbidden` (ADR-8). */
export function getSessionNoticeMessage(notice: SessionNotice): string {
  return SESSION_NOTICE_MESSAGES[notice];
}
