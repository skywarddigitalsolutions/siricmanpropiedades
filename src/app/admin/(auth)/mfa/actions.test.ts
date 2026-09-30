// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCookieStore, expectRedirect, RedirectError } from "@/test/next-server";
import { MFA_PENDING_COOKIE, SESSION_COOKIE } from "@/lib/session/cookie-names";

const { cookies } = vi.hoisted(() => ({ cookies: vi.fn() }));
vi.mock("next/headers", () => ({ cookies }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

const { verifyMfa, logout } = vi.hoisted(() => ({
  verifyMfa: vi.fn(),
  logout: vi.fn(),
}));
vi.mock("@/lib/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth")>();
  return { ...actual, verifyMfa, logout };
});

import { ApiError } from "@/lib/api/client";
import { verifyMfaAction } from "./actions";
import type { FormState } from "./actions";

function formDataFor(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("verifyMfaAction", () => {
  let store: ReturnType<typeof createCookieStore>;
  const initial: FormState = {};

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    store = createCookieStore();
    cookies.mockResolvedValue(store);
    verifyMfa.mockReset();
    logout.mockReset();
  });

  it("redirects to /admin/login when the mfaToken cookie is missing", async () => {
    await expectRedirect(
      verifyMfaAction(initial, formDataFor({ code: "123456" })),
      "/admin/login",
    );

    expect(verifyMfa).not.toHaveBeenCalled();
  });

  it("sets the session cookie, clears the mfa cookie, and redirects to /admin on a correct code", async () => {
    store.set(MFA_PENDING_COOKIE, "mfa-token-1");
    verifyMfa.mockResolvedValue({
      id: "u1",
      userName: "gabriel",
      isActive: true,
      roles: ["admin"],
      token: "jwt-admin",
    });

    await expectRedirect(
      verifyMfaAction(initial, formDataFor({ code: "123456" })),
      "/admin",
    );

    expect(verifyMfa).toHaveBeenCalledWith("mfa-token-1", "123456");
    expect(store.get(SESSION_COOKIE)?.value).toBe("jwt-admin");
    expect(store.get(MFA_PENDING_COOKIE)?.value).toBeFalsy();
  });

  it("keeps the mfaToken cookie intact and shows invalid-code on a wrong code (401)", async () => {
    store.set(MFA_PENDING_COOKIE, "mfa-token-1");
    verifyMfa.mockRejectedValue(new ApiError(401, "wrong code"));

    const state = await verifyMfaAction(
      initial,
      formDataFor({ code: "000000" }),
    );

    expect(state).toEqual({ error: "invalid-code" });
    expect(store.get(MFA_PENDING_COOKIE)?.value).toBe("mfa-token-1");
  });

  it("clears the stale mfaToken cookie and redirects to /admin/login for any other rejection (expired/invalid/consumed)", async () => {
    store.set(MFA_PENDING_COOKIE, "mfa-token-1");
    verifyMfa.mockRejectedValue(new ApiError(400, "token no longer valid"));

    await expectRedirect(
      verifyMfaAction(initial, formDataFor({ code: "123456" })),
      "/admin/login",
    );

    expect(store.get(MFA_PENDING_COOKIE)?.value).toBeFalsy();
  });

  it("applies the role gate: a user-role account is logged out and denied, with no session cookie set", async () => {
    store.set(MFA_PENDING_COOKIE, "mfa-token-1");
    verifyMfa.mockResolvedValue({
      id: "u2",
      userName: "carla",
      isActive: true,
      roles: ["user"],
      token: "jwt-user",
    });

    const state = await verifyMfaAction(
      initial,
      formDataFor({ code: "123456" }),
    );

    expect(state).toEqual({ error: "no-access" });
    expect(logout).toHaveBeenCalledWith("jwt-user");
    expect(store.get(SESSION_COOKIE)?.value).toBeFalsy();
    expect(store.get(MFA_PENDING_COOKIE)?.value).toBeFalsy();
  });
});
