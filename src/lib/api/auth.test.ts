// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("./client", () => ({ apiFetch }));

import {
  changePassword,
  confirmMfa,
  enableMfa,
  getMe,
  isMfaRequired,
  isMfaSetupRequired,
  login,
  logout,
  regenerateBackupCodes,
  verifyMfa,
  type FullSessionResponse,
  type MfaRequiredResponse,
  type MfaSetupRequiredResponse,
} from "./auth";

describe("auth endpoint functions", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it("login posts credentials to /auth/login with no token", async () => {
    apiFetch.mockResolvedValue({
      id: "u1",
      userName: "gabriel",
      isActive: true,
      roles: ["admin"],
      token: "jwt",
    });

    await login("gabriel", "secret");

    expect(apiFetch).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: { userName: "gabriel", password: "secret" },
    });
  });

  it("verifyMfa posts the mfaToken and code to /auth/mfa/verify with no bearer token", async () => {
    apiFetch.mockResolvedValue({
      id: "u1",
      userName: "gabriel",
      isActive: true,
      roles: ["admin"],
      token: "jwt",
    });

    await verifyMfa("mfa-token-123", "654321");

    expect(apiFetch).toHaveBeenCalledWith("/auth/mfa/verify", {
      method: "POST",
      body: { mfaToken: "mfa-token-123", code: "654321" },
    });
  });

  it("enableMfa posts the password to /auth/mfa/enable bearing the setup token", async () => {
    apiFetch.mockResolvedValue({ secret: "SECRET", otpauthUrl: "otpauth://..." });

    await enableMfa("setup-token-123", "my-password");

    expect(apiFetch).toHaveBeenCalledWith("/auth/mfa/enable", {
      method: "POST",
      body: { password: "my-password" },
      token: "setup-token-123",
    });
  });

  it("confirmMfa posts the code to /auth/mfa/confirm bearing the setup token", async () => {
    apiFetch.mockResolvedValue({ backupCodes: ["a", "b"] });

    await confirmMfa("setup-token-123", "111111");

    expect(apiFetch).toHaveBeenCalledWith("/auth/mfa/confirm", {
      method: "POST",
      body: { code: "111111" },
      token: "setup-token-123",
    });
  });

  it("logout posts to /auth/logout bearing the session token", async () => {
    apiFetch.mockResolvedValue(undefined);

    await logout("session-token-123");

    expect(apiFetch).toHaveBeenCalledWith("/auth/logout", {
      method: "POST",
      token: "session-token-123",
    });
  });

  it("getMe fetches /auth/me bearing the session token", async () => {
    apiFetch.mockResolvedValue({
      id: "u1",
      userName: "gabriel",
      isActive: true,
      roles: ["admin"],
    });

    const result = await getMe("session-token-123");

    expect(apiFetch).toHaveBeenCalledWith("/auth/me", {
      token: "session-token-123",
    });
    expect(result).toEqual({
      id: "u1",
      userName: "gabriel",
      isActive: true,
      roles: ["admin"],
    });
  });

  it("changePassword patches /auth/password with the bearer token", async () => {
    apiFetch.mockResolvedValue({ id: "u1", userName: "g", isActive: true, roles: [], token: "new" });

    const result = await changePassword("jwt", {
      currentPassword: "Actual1",
      newPassword: "Nueva123",
      code: "123456",
    });

    expect(apiFetch).toHaveBeenCalledWith("/auth/password", {
      method: "PATCH",
      body: { currentPassword: "Actual1", newPassword: "Nueva123", code: "123456" },
      token: "jwt",
    });
    expect(result.token).toBe("new");
  });

  it("regenerateBackupCodes posts the TOTP to /auth/mfa/backup-codes", async () => {
    apiFetch.mockResolvedValue({ backupCodes: ["a"] });

    expect(await regenerateBackupCodes("jwt", "123456")).toEqual({ backupCodes: ["a"] });
    expect(apiFetch).toHaveBeenCalledWith("/auth/mfa/backup-codes", {
      method: "POST",
      body: { code: "123456" },
      token: "jwt",
    });
  });

  describe("type guards", () => {
    const fullSession: FullSessionResponse = {
      id: "u1",
      userName: "gabriel",
      isActive: true,
      roles: ["admin"],
      token: "jwt",
    };
    const mfaRequired: MfaRequiredResponse = {
      mfaRequired: true,
      mfaToken: "mfa-token",
    };
    const mfaSetupRequired: MfaSetupRequiredResponse = {
      mfaSetupRequired: true,
      setupToken: "setup-token",
    };

    it("isMfaRequired is true only for the mfaRequired shape", () => {
      expect(isMfaRequired(mfaRequired)).toBe(true);
      expect(isMfaRequired(fullSession)).toBe(false);
      expect(isMfaRequired(mfaSetupRequired)).toBe(false);
    });

    it("isMfaSetupRequired is true only for the mfaSetupRequired shape", () => {
      expect(isMfaSetupRequired(mfaSetupRequired)).toBe(true);
      expect(isMfaSetupRequired(fullSession)).toBe(false);
      expect(isMfaSetupRequired(mfaRequired)).toBe(false);
    });
  });
});
