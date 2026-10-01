// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCookieStore, expectRedirect, RedirectError } from "@/test/next-server";
import {
  MFA_PENDING_COOKIE,
  MFA_PENDING_MAX_AGE,
  SESSION_COOKIE,
  SETUP_PENDING_COOKIE,
  SETUP_PENDING_MAX_AGE,
} from "@/lib/session/cookie-names";

const { cookies } = vi.hoisted(() => ({ cookies: vi.fn() }));
vi.mock("next/headers", () => ({ cookies }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

const { login, logout } = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
}));
vi.mock("@/lib/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth")>();
  return { ...actual, login, logout };
});

import { ApiError } from "@/lib/api/client";
import { loginAction } from "./actions";
import type { FormState } from "./actions";

function formDataFor(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("loginAction", () => {
  let store: ReturnType<typeof createCookieStore>;
  const initial: FormState = {};

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    store = createCookieStore();
    cookies.mockResolvedValue(store);
    login.mockReset();
    logout.mockReset();
  });

  it("sets the session cookie and redirects to /admin for an admin/manager full session", async () => {
    login.mockResolvedValue({
      id: "u1",
      userName: "gabriel",
      isActive: true,
      roles: ["admin"],
      token: "jwt-admin",
    });

    await expectRedirect(
      loginAction(initial, formDataFor({ userName: "gabriel", password: "pw" })),
      "/admin",
    );

    expect(store.get(SESSION_COOKIE)?.value).toBe("jwt-admin");
    expect(logout).not.toHaveBeenCalled();
  });

  it("logs out and returns no-access for a user-role full session, without keeping a session cookie", async () => {
    login.mockResolvedValue({
      id: "u2",
      userName: "carla",
      isActive: true,
      roles: ["user"],
      token: "jwt-user",
    });

    const state = await loginAction(
      initial,
      formDataFor({ userName: "carla", password: "pw" }),
    );

    expect(state).toEqual({ error: "no-access" });
    expect(logout).toHaveBeenCalledWith("jwt-user");
    expect(store.get(SESSION_COOKIE)?.value).toBeFalsy();
  });

  it("sets the mfa-pending cookie (300s) and redirects to /admin/mfa when MFA is required", async () => {
    login.mockResolvedValue({ mfaRequired: true, mfaToken: "mfa-token-1" });

    await expectRedirect(
      loginAction(initial, formDataFor({ userName: "gabriel", password: "pw" })),
      "/admin/mfa",
    );

    const [call] = store
      .getSetCalls()
      .filter((c) => c.name === MFA_PENDING_COOKIE);
    expect(call?.value).toBe("mfa-token-1");
    expect(call?.options).toMatchObject({ maxAge: MFA_PENDING_MAX_AGE });
  });

  it("sets the setup-pending cookie (900s) and redirects to /admin/mfa/setup when MFA setup is required", async () => {
    login.mockResolvedValue({
      mfaSetupRequired: true,
      setupToken: "setup-token-1",
    });

    await expectRedirect(
      loginAction(initial, formDataFor({ userName: "diego", password: "pw" })),
      "/admin/mfa/setup",
    );

    const [call] = store
      .getSetCalls()
      .filter((c) => c.name === SETUP_PENDING_COOKIE);
    expect(call?.value).toBe("setup-token-1");
    expect(call?.options).toMatchObject({ maxAge: SETUP_PENDING_MAX_AGE });
  });

  it.each([
    [401, "invalid-credentials"],
    [400, "invalid-credentials"],
    [429, "throttled"],
  ] as const)(
    "maps a %i login rejection to %s without setting any cookie",
    async (status, expectedError) => {
      login.mockRejectedValue(new ApiError(status, "rejected"));

      const state = await loginAction(
        initial,
        formDataFor({ userName: "gabriel", password: "wrong" }),
      );

      expect(state.error).toBe(expectedError);
      expect(store.getSetCalls()).toHaveLength(0);
    },
  );

  it("maps a network failure (ApiError(0)) to unavailable", async () => {
    login.mockRejectedValue(new ApiError(0, "No se pudo contactar al servicio."));

    const state = await loginAction(
      initial,
      formDataFor({ userName: "gabriel", password: "pw" }),
    );

    expect(state.error).toBe("unavailable");
  });

  it("returns validation without calling the API when a required field is empty", async () => {
    const state = await loginAction(
      initial,
      formDataFor({ userName: "", password: "" }),
    );

    expect(state).toEqual({ error: "validation" });
    expect(login).not.toHaveBeenCalled();
  });
});
