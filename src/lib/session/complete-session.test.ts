// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCookieStore } from "@/test/next-server";
import {
  MFA_PENDING_COOKIE,
  SESSION_COOKIE,
  SETUP_PENDING_COOKIE,
} from "./cookie-names";

const { cookies } = vi.hoisted(() => ({ cookies: vi.fn() }));
vi.mock("next/headers", () => ({ cookies }));

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));
vi.mock("@/lib/api/auth", () => ({ logout }));

import { completeSession } from "./complete-session";

describe("completeSession", () => {
  let store: ReturnType<typeof createCookieStore>;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    store = createCookieStore({
      [MFA_PENDING_COOKIE]: "stale-mfa",
      [SETUP_PENDING_COOKIE]: "stale-setup",
    });
    cookies.mockResolvedValue(store);
    logout.mockReset();
  });

  it("sets the session cookie and clears the pending cookies when the role gate passes", async () => {
    const result = await completeSession({
      id: "u1",
      userName: "gabriel",
      isActive: true,
      roles: ["admin"],
      token: "jwt-admin",
    });

    expect(result).toBe("ok");
    expect(store.get(SESSION_COOKIE)?.value).toBe("jwt-admin");
    expect(store.get(MFA_PENDING_COOKIE)?.value).toBe("");
    expect(store.get(SETUP_PENDING_COOKIE)?.value).toBe("");
    expect(logout).not.toHaveBeenCalled();
  });

  it("revokes the token, clears every cookie, and returns forbidden when the role gate fails", async () => {
    logout.mockResolvedValue(undefined);

    const result = await completeSession({
      id: "u2",
      userName: "carla",
      isActive: true,
      roles: ["user"],
      token: "jwt-user",
    });

    expect(result).toBe("forbidden");
    expect(logout).toHaveBeenCalledWith("jwt-user");
    expect(store.get(SESSION_COOKIE)?.value).toBeFalsy();
    expect(store.get(MFA_PENDING_COOKIE)?.value).toBe("");
    expect(store.get(SETUP_PENDING_COOKIE)?.value).toBe("");
  });

  it("swallows a failed best-effort logout and still clears cookies and returns forbidden", async () => {
    logout.mockRejectedValue(new Error("network down"));

    const result = await completeSession({
      id: "u3",
      userName: "denied",
      isActive: true,
      roles: [],
      token: "jwt-denied",
    });

    expect(result).toBe("forbidden");
    expect(store.get(SESSION_COOKIE)?.value).toBeFalsy();
  });
});
