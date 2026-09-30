// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCookieStore,
  expectRedirect,
  RedirectError,
} from "@/test/next-server";
import {
  SESSION_COOKIE,
  SETUP_PENDING_COOKIE,
} from "@/lib/session/cookie-names";

const { cookies } = vi.hoisted(() => ({ cookies: vi.fn() }));
vi.mock("next/headers", () => ({ cookies }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

const { enableMfa, confirmMfa } = vi.hoisted(() => ({
  enableMfa: vi.fn(),
  confirmMfa: vi.fn(),
}));
vi.mock("@/lib/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth")>();
  return { ...actual, enableMfa, confirmMfa };
});

const { renderQrDataUri } = vi.hoisted(() => ({
  renderQrDataUri: vi.fn(),
}));
vi.mock("@/lib/mfa/qr", () => ({ renderQrDataUri }));

import { ApiError } from "@/lib/api/client";
import { confirmMfaAction, enableMfaAction } from "./actions";

// Exact messages thrown by AuthService.resolveUserFromToken/verifyToken
// (back-siricmanpropiedades src/auth/auth.service.ts) whenever the
// setupToken itself is rejected, before the endpoint's own logic runs.
const TOKEN_REJECTED_MESSAGES = [
  "Invalid or expired token",
  "This token cannot be used for this operation",
  "Token has been revoked",
  "Token not valid",
  "User is not active",
];

describe("enableMfaAction", () => {
  let store: ReturnType<typeof createCookieStore>;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    store = createCookieStore();
    cookies.mockResolvedValue(store);
    enableMfa.mockReset();
    renderQrDataUri.mockReset();
  });

  it("redirects to /admin/login when the setupToken cookie is missing", async () => {
    await expectRedirect(enableMfaAction("some-password"), "/admin/login");

    expect(enableMfa).not.toHaveBeenCalled();
  });

  it("returns the scan step with the rendered QR and secret on a correct password", async () => {
    store.set(SETUP_PENDING_COOKIE, "setup-token-1");
    enableMfa.mockResolvedValue({
      secret: "JBSWY3DPEHPK3PXP",
      otpauthUrl: "otpauth://totp/BaseAuth:gabriel?secret=JBSWY3DPEHPK3PXP",
    });
    renderQrDataUri.mockResolvedValue("data:image/svg+xml;base64,xxx");

    const result = await enableMfaAction("correct-password");

    expect(enableMfa).toHaveBeenCalledWith("setup-token-1", "correct-password");
    expect(renderQrDataUri).toHaveBeenCalledWith(
      "otpauth://totp/BaseAuth:gabriel?secret=JBSWY3DPEHPK3PXP",
    );
    expect(result).toEqual({
      step: "scan",
      qrSvgDataUri: "data:image/svg+xml;base64,xxx",
      secret: "JBSWY3DPEHPK3PXP",
    });
    expect(store.get(SESSION_COOKIE)?.value).toBeFalsy();
  });

  it("stays on the password step with no QR/secret for a wrong password (401 'Invalid credentials')", async () => {
    store.set(SETUP_PENDING_COOKIE, "setup-token-1");
    enableMfa.mockRejectedValue(new ApiError(401, "Invalid credentials"));

    const result = await enableMfaAction("wrong-password");

    expect(result).toEqual({ step: "password", error: "invalid-password" });
    expect(store.get(SETUP_PENDING_COOKIE)?.value).toBe("setup-token-1");
    expect(renderQrDataUri).not.toHaveBeenCalled();
  });

  it.each(TOKEN_REJECTED_MESSAGES)(
    "clears the stale setupToken cookie and redirects to /admin/login?reason=expired for a 401 with message %j",
    async (message) => {
      store.set(SETUP_PENDING_COOKIE, "setup-token-1");
      enableMfa.mockRejectedValue(new ApiError(401, message));

      await expectRedirect(
        enableMfaAction("any-password"),
        "/admin/login?reason=expired",
      );

      expect(store.get(SETUP_PENDING_COOKIE)?.value).toBeFalsy();
    },
  );

  it("clears the stale setupToken cookie and redirects to expired when MFA was already enabled", async () => {
    store.set(SETUP_PENDING_COOKIE, "setup-token-1");
    enableMfa.mockRejectedValue(new ApiError(400, "MFA is already enabled"));

    await expectRedirect(
      enableMfaAction("any-password"),
      "/admin/login?reason=expired",
    );

    expect(store.get(SETUP_PENDING_COOKIE)?.value).toBeFalsy();
  });

  it("returns a throttled error on 429 without clearing the setupToken cookie", async () => {
    store.set(SETUP_PENDING_COOKIE, "setup-token-1");
    enableMfa.mockRejectedValue(new ApiError(429, "Too many requests"));

    const result = await enableMfaAction("any-password");

    expect(result).toEqual({ step: "password", error: "throttled" });
    expect(store.get(SETUP_PENDING_COOKIE)?.value).toBe("setup-token-1");
  });

  it("returns an unavailable error for a network failure", async () => {
    store.set(SETUP_PENDING_COOKIE, "setup-token-1");
    enableMfa.mockRejectedValue(new ApiError(0, "No se pudo contactar al servicio."));

    const result = await enableMfaAction("any-password");

    expect(result).toEqual({ step: "password", error: "unavailable" });
  });
});

describe("confirmMfaAction", () => {
  let store: ReturnType<typeof createCookieStore>;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    store = createCookieStore();
    cookies.mockResolvedValue(store);
    confirmMfa.mockReset();
  });

  it("redirects to /admin/login when the setupToken cookie is missing", async () => {
    await expectRedirect(confirmMfaAction("123456"), "/admin/login");

    expect(confirmMfa).not.toHaveBeenCalled();
  });

  it("returns the backup codes and clears the setupToken cookie on a correct code", async () => {
    store.set(SETUP_PENDING_COOKIE, "setup-token-1");
    confirmMfa.mockResolvedValue({
      backupCodes: Array.from({ length: 10 }, (_, i) => `code-${i}`),
    });

    const result = await confirmMfaAction("123456");

    expect(confirmMfa).toHaveBeenCalledWith("setup-token-1", "123456");
    expect(result).toEqual({
      step: "codes",
      backupCodes: Array.from({ length: 10 }, (_, i) => `code-${i}`),
    });
    expect(store.get(SETUP_PENDING_COOKIE)?.value).toBeFalsy();
    expect(store.get(SESSION_COOKIE)?.value).toBeFalsy();
  });

  it("stays on the scan step with no backup codes for a wrong code (400 'Invalid code')", async () => {
    store.set(SETUP_PENDING_COOKIE, "setup-token-1");
    confirmMfa.mockRejectedValue(new ApiError(400, "Invalid code"));

    const result = await confirmMfaAction("000000");

    expect(result).toEqual({ step: "scan", error: "invalid-code" });
    expect(store.get(SETUP_PENDING_COOKIE)?.value).toBe("setup-token-1");
    expect(store.get(SESSION_COOKIE)?.value).toBeFalsy();
  });

  it.each(TOKEN_REJECTED_MESSAGES)(
    "clears the stale setupToken cookie and redirects to /admin/login?reason=expired for a 401 with message %j",
    async (message) => {
      store.set(SETUP_PENDING_COOKIE, "setup-token-1");
      confirmMfa.mockRejectedValue(new ApiError(401, message));

      await expectRedirect(
        confirmMfaAction("123456"),
        "/admin/login?reason=expired",
      );

      expect(store.get(SETUP_PENDING_COOKIE)?.value).toBeFalsy();
    },
  );

  it.each([
    "MFA is already enabled",
    "No pending MFA enrollment. Call /auth/mfa/enable first",
  ])(
    "clears the stale setupToken cookie and redirects to expired for a 400 with message %j",
    async (message) => {
      store.set(SETUP_PENDING_COOKIE, "setup-token-1");
      confirmMfa.mockRejectedValue(new ApiError(400, message));

      await expectRedirect(
        confirmMfaAction("123456"),
        "/admin/login?reason=expired",
      );

      expect(store.get(SETUP_PENDING_COOKIE)?.value).toBeFalsy();
    },
  );

  it("returns a throttled error on 429 without clearing the setupToken cookie", async () => {
    store.set(SETUP_PENDING_COOKIE, "setup-token-1");
    confirmMfa.mockRejectedValue(new ApiError(429, "Too many requests"));

    const result = await confirmMfaAction("123456");

    expect(result).toEqual({ step: "scan", error: "throttled" });
    expect(store.get(SETUP_PENDING_COOKIE)?.value).toBe("setup-token-1");
  });
});
