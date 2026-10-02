import "server-only";
import { apiFetch } from "./client";

export type SessionUser = {
  id: string;
  userName: string;
  isActive: boolean;
  roles: string[];
};

export type FullSessionResponse = SessionUser & { token: string };
export type MfaRequiredResponse = { mfaRequired: true; mfaToken: string };
export type MfaSetupRequiredResponse = {
  mfaSetupRequired: true;
  setupToken: string;
};

export type LoginResponse =
  | FullSessionResponse
  | MfaRequiredResponse
  | MfaSetupRequiredResponse;

export function isMfaRequired(
  response: LoginResponse,
): response is MfaRequiredResponse {
  return "mfaRequired" in response && response.mfaRequired === true;
}

export function isMfaSetupRequired(
  response: LoginResponse,
): response is MfaSetupRequiredResponse {
  return "mfaSetupRequired" in response && response.mfaSetupRequired === true;
}

/** `POST /api/auth/login` — public. Returns one of the three `LoginResponse` shapes. */
export function login(
  userName: string,
  password: string,
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: { userName, password },
  });
}

/** `POST /api/auth/mfa/verify` — public; `mfaToken` travels in the body, not as a bearer token. */
export function verifyMfa(
  mfaToken: string,
  code: string,
): Promise<FullSessionResponse> {
  return apiFetch<FullSessionResponse>("/auth/mfa/verify", {
    method: "POST",
    body: { mfaToken, code },
  });
}

/** `POST /api/auth/mfa/enable` — bearer `setupToken`. */
export function enableMfa(
  token: string,
  password: string,
): Promise<{ secret: string; otpauthUrl: string }> {
  return apiFetch<{ secret: string; otpauthUrl: string }>(
    "/auth/mfa/enable",
    { method: "POST", body: { password }, token },
  );
}

/** `POST /api/auth/mfa/confirm` — bearer `setupToken`. */
export function confirmMfa(
  token: string,
  code: string,
): Promise<{ backupCodes: string[] }> {
  return apiFetch<{ backupCodes: string[] }>("/auth/mfa/confirm", {
    method: "POST",
    body: { code },
    token,
  });
}

/** `POST /api/auth/logout` — bearer the session (or setup) token being revoked. */
export function logout(token: string): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST", token });
}

/** `GET /api/auth/me` — non-rotating session read; bearer the session token. */
export function getMe(token: string): Promise<SessionUser> {
  return apiFetch<SessionUser>("/auth/me", { token });
}

/** `PATCH /api/auth/password` — bearer the session. Returns a fresh session (every other one is closed). */
export function changePassword(
  token: string,
  body: { currentPassword: string; newPassword: string; code?: string },
): Promise<FullSessionResponse> {
  return apiFetch<FullSessionResponse>("/auth/password", {
    method: "PATCH",
    body,
    token,
  });
}

/** `POST /api/auth/mfa/backup-codes` — needs a current 6-digit TOTP; the codes are shown once. */
export function regenerateBackupCodes(
  token: string,
  code: string,
): Promise<{ backupCodes: string[] }> {
  return apiFetch<{ backupCodes: string[] }>("/auth/mfa/backup-codes", {
    method: "POST",
    body: { code },
    token,
  });
}
