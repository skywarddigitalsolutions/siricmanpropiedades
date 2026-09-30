// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCookieStore,
  expectRedirect,
  RedirectError,
} from "@/test/next-server";
import { SESSION_COOKIE } from "@/lib/session/cookie-names";

const { cookies } = vi.hoisted(() => ({ cookies: vi.fn() }));
vi.mock("next/headers", () => ({ cookies }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));
vi.mock("@/lib/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth")>();
  return { ...actual, logout };
});

import { logoutAction } from "./actions";

describe("logoutAction", () => {
  let store: ReturnType<typeof createCookieStore>;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    store = createCookieStore({ [SESSION_COOKIE]: "jwt-token" });
    cookies.mockResolvedValue(store);
    logout.mockReset();
  });

  it("revokes the token, clears the session cookie, and redirects to /admin/login on success", async () => {
    logout.mockResolvedValue(undefined);

    await expectRedirect(logoutAction(), "/admin/login");

    expect(logout).toHaveBeenCalledWith("jwt-token");
    expect(store.get(SESSION_COOKIE)?.value).toBeFalsy();
  });

  it("still clears the session cookie and redirects to /admin/login when the API logout call fails", async () => {
    logout.mockRejectedValue(new Error("service unreachable"));

    await expectRedirect(logoutAction(), "/admin/login");

    expect(store.get(SESSION_COOKIE)?.value).toBeFalsy();
  });

  it("clears cookies and redirects even when there is no session cookie to begin with", async () => {
    store = createCookieStore();
    cookies.mockResolvedValue(store);

    await expectRedirect(logoutAction(), "/admin/login");

    expect(logout).not.toHaveBeenCalled();
  });
});
