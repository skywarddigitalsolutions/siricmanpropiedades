// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCookieStore,
  expectRedirect,
  RedirectError,
} from "@/test/next-server";
import { SESSION_COOKIE } from "./cookie-names";

const { cookies } = vi.hoisted(() => ({ cookies: vi.fn() }));
vi.mock("next/headers", () => ({ cookies }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

const { getMe, logout } = vi.hoisted(() => ({
  getMe: vi.fn(),
  logout: vi.fn(),
}));
vi.mock("@/lib/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth")>();
  return { ...actual, getMe, logout };
});

import { ApiError } from "@/lib/api/client";
import { getCurrentUser, getSessionToken } from "./dal";

describe("getSessionToken", () => {
  let store: ReturnType<typeof createCookieStore>;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    store = createCookieStore();
    cookies.mockResolvedValue(store);
  });

  it("redirects to /admin/login when the session cookie is missing", async () => {
    await expectRedirect(getSessionToken(), "/admin/login");
  });

  it("returns the session token when the cookie is present", async () => {
    store.set(SESSION_COOKIE, "jwt-admin");
    await expect(getSessionToken()).resolves.toBe("jwt-admin");
  });
});

describe("getCurrentUser", () => {
  let store: ReturnType<typeof createCookieStore>;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    store = createCookieStore({ [SESSION_COOKIE]: "jwt-token" });
    cookies.mockResolvedValue(store);
    getMe.mockReset();
    logout.mockReset();
  });

  it("returns the session user when /auth/me succeeds and the role gate passes", async () => {
    getMe.mockResolvedValue({
      id: "u1",
      userName: "gabriel",
      isActive: true,
      roles: ["admin"],
    });

    await expect(getCurrentUser()).resolves.toEqual({
      id: "u1",
      userName: "gabriel",
      isActive: true,
      roles: ["admin"],
    });
    expect(getMe).toHaveBeenCalledWith("jwt-token");
    expect(logout).not.toHaveBeenCalled();
    expect(store.get(SESSION_COOKIE)?.value).toBe("jwt-token");
  });

  it("clears the session cookie and redirects to /admin/login?reason=expired on a 401 from /auth/me", async () => {
    getMe.mockRejectedValue(new ApiError(401, "Invalid or expired token"));

    await expectRedirect(getCurrentUser(), "/admin/login?reason=expired");

    expect(store.get(SESSION_COOKIE)?.value).toBeFalsy();
  });

  it("revokes the token, clears the cookie, and redirects to /admin/login?reason=forbidden when the role is no longer allowed", async () => {
    getMe.mockResolvedValue({
      id: "u2",
      userName: "carla",
      isActive: true,
      roles: ["user"],
    });
    logout.mockResolvedValue(undefined);

    await expectRedirect(getCurrentUser(), "/admin/login?reason=forbidden");

    expect(logout).toHaveBeenCalledWith("jwt-token");
    expect(store.get(SESSION_COOKIE)?.value).toBeFalsy();
  });

  it("swallows a failed best-effort logout and still redirects to /admin/login?reason=forbidden", async () => {
    getMe.mockResolvedValue({
      id: "u3",
      userName: "denied",
      isActive: true,
      roles: [],
    });
    logout.mockRejectedValue(new Error("network down"));

    await expectRedirect(getCurrentUser(), "/admin/login?reason=forbidden");

    expect(store.get(SESSION_COOKIE)?.value).toBeFalsy();
  });

  it("rethrows an ApiError(0) network failure instead of redirecting, for the error.tsx boundary", async () => {
    getMe.mockRejectedValue(new ApiError(0, "No se pudo contactar al servicio."));

    await expect(getCurrentUser()).rejects.toBeInstanceOf(ApiError);
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 0 });
  });
});

// Note on the "deduped via React.cache" acceptance criterion (tasks.md 5.1):
// `getCurrentUser` is implemented wrapped in `cache()` from `"react"`, per
// design.md ADR-7. That memoization is verified NOT testable in this
// project's Vitest harness: `React.cache()` only memoizes under the
// `react-server` build/condition that Next.js's own server runtime provides
// (`node_modules/react/cjs/react.react-server.development.js`); the plain
// build this project's `vitest.config.ts` resolves
// (`node_modules/react/cjs/react.development.js`, no `react-server`
// condition configured) ships `exports.cache = fn => (...args) => fn(...args)`
// — a bare passthrough with zero memoization, confirmed by direct inspection
// of that file and by a Node probe (`react.cache()`-wrapped calls run twice
// even inside `ReactDOMServer.renderToReadableStream`). This mirrors the
// precedent already recorded in ADR-10: the async Server Component request
// lifecycle cannot be exercised by Vitest. The wrapping itself is verified by
// code review (see `dal.ts`), not by a unit assertion that would be
// unfalsifiable in this harness.
