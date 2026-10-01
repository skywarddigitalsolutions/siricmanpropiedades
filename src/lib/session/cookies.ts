import "server-only";
import { cookies } from "next/headers";
import {
  MFA_PENDING_COOKIE,
  MFA_PENDING_MAX_AGE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  SETUP_PENDING_COOKIE,
  SETUP_PENDING_MAX_AGE,
  cookieName,
  cookiePath,
} from "./cookie-names";

export type SessionCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  path: string;
  secure: boolean;
  maxAge: number;
};

/**
 * Shared cookie option shape for the three admin session cookies (ADR-2):
 * httpOnly, `SameSite=Lax`, `Secure` only in production (so local HTTP dev
 * still works), `Path=/admin` in dev and `Path=/` in production (`__Host-`),
 * and the caller-supplied lifetime.
 */
export function cookieOptions(maxAge: number): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: cookiePath(),
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export async function setSessionCookie(token: string): Promise<void> {
  (await cookies()).set(
    cookieName(SESSION_COOKIE),
    token,
    cookieOptions(SESSION_MAX_AGE),
  );
}

export async function setMfaPendingCookie(mfaToken: string): Promise<void> {
  (await cookies()).set(
    cookieName(MFA_PENDING_COOKIE),
    mfaToken,
    cookieOptions(MFA_PENDING_MAX_AGE),
  );
}

export async function setSetupPendingCookie(
  setupToken: string,
): Promise<void> {
  (await cookies()).set(
    cookieName(SETUP_PENDING_COOKIE),
    setupToken,
    cookieOptions(SETUP_PENDING_MAX_AGE),
  );
}

export async function getSessionCookie(): Promise<string | undefined> {
  return (await cookies()).get(cookieName(SESSION_COOKIE))?.value;
}

export async function getMfaPendingCookie(): Promise<string | undefined> {
  return (await cookies()).get(cookieName(MFA_PENDING_COOKIE))?.value;
}

export async function getSetupPendingCookie(): Promise<string | undefined> {
  return (await cookies()).get(cookieName(SETUP_PENDING_COOKIE))?.value;
}

/** Deletion uses `set(name, "", { ...options, maxAge: 0 })`, so the path always matches (ADR-2). */
export async function clearSessionCookie(): Promise<void> {
  (await cookies()).set(cookieName(SESSION_COOKIE), "", {
    ...cookieOptions(SESSION_MAX_AGE),
    maxAge: 0,
  });
}

export async function clearMfaPendingCookie(): Promise<void> {
  (await cookies()).set(cookieName(MFA_PENDING_COOKIE), "", {
    ...cookieOptions(MFA_PENDING_MAX_AGE),
    maxAge: 0,
  });
}

export async function clearSetupPendingCookie(): Promise<void> {
  (await cookies()).set(cookieName(SETUP_PENDING_COOKIE), "", {
    ...cookieOptions(SETUP_PENDING_MAX_AGE),
    maxAge: 0,
  });
}

/** Clears all three admin session cookies (logout, role-gate failure, or a fresh login). */
export async function clearAllSessionCookies(): Promise<void> {
  await clearSessionCookie();
  await clearMfaPendingCookie();
  await clearSetupPendingCookie();
}
