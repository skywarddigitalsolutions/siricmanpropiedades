// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCookieStore } from "@/test/next-server";
import {
  ADMIN_COOKIE_PATH,
  MFA_PENDING_COOKIE,
  MFA_PENDING_MAX_AGE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  SETUP_PENDING_COOKIE,
  SETUP_PENDING_MAX_AGE,
} from "./cookie-names";

const { cookies } = vi.hoisted(() => ({ cookies: vi.fn() }));
vi.mock("next/headers", () => ({ cookies }));

import {
  clearAllSessionCookies,
  clearSessionCookie,
  cookieOptions,
  getSessionCookie,
  setMfaPendingCookie,
  setSessionCookie,
  setSetupPendingCookie,
} from "./cookies";

describe("cookieOptions", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is not secure in development", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(cookieOptions(SESSION_MAX_AGE)).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: ADMIN_COOKIE_PATH,
      secure: false,
      maxAge: SESSION_MAX_AGE,
    });
  });

  it("is secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(cookieOptions(SESSION_MAX_AGE)).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
      maxAge: SESSION_MAX_AGE,
    });
  });

  it("uses the max-age passed in for the pending-token lifetimes", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(cookieOptions(MFA_PENDING_MAX_AGE).maxAge).toBe(300);
    expect(cookieOptions(SETUP_PENDING_MAX_AGE).maxAge).toBe(900);
  });
});

describe("cookie get/set/clear helpers", () => {
  let store: ReturnType<typeof createCookieStore>;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    store = createCookieStore();
    cookies.mockResolvedValue(store);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("setSessionCookie sets the session cookie with the 3600s max-age", async () => {
    await setSessionCookie("jwt-token");

    const [call] = store.getSetCalls();
    expect(call?.name).toBe(`__Host-${SESSION_COOKIE}`);
    expect(call?.value).toBe("jwt-token");
    expect(call?.options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
      maxAge: SESSION_MAX_AGE,
    });
  });

  it("setMfaPendingCookie sets the mfa cookie with the 300s max-age", async () => {
    await setMfaPendingCookie("mfa-token");

    const [call] = store.getSetCalls();
    expect(call?.name).toBe(`__Host-${MFA_PENDING_COOKIE}`);
    expect(call?.options).toMatchObject({ maxAge: MFA_PENDING_MAX_AGE });
  });

  it("setSetupPendingCookie sets the setup cookie with the 900s max-age", async () => {
    await setSetupPendingCookie("setup-token");

    const [call] = store.getSetCalls();
    expect(call?.name).toBe(`__Host-${SETUP_PENDING_COOKIE}`);
    expect(call?.options).toMatchObject({ maxAge: SETUP_PENDING_MAX_AGE });
  });

  it("getSessionCookie reads back the session cookie value", async () => {
    store.set(`__Host-${SESSION_COOKIE}`, "existing-jwt");

    await expect(getSessionCookie()).resolves.toBe("existing-jwt");
  });

  it("getSessionCookie returns undefined when the cookie is absent", async () => {
    await expect(getSessionCookie()).resolves.toBeUndefined();
  });

  it("clearSessionCookie sets maxAge: 0 on the same path", async () => {
    await clearSessionCookie();

    const [call] = store.getSetCalls();
    expect(call?.name).toBe(`__Host-${SESSION_COOKIE}`);
    expect(call?.value).toBe("");
    expect(call?.options).toMatchObject({
      path: "/",
      maxAge: 0,
    });
  });

  it("clearAllSessionCookies clears all three cookies with maxAge: 0", async () => {
    await clearAllSessionCookies();

    const calls = store.getSetCalls();
    expect(calls).toHaveLength(3);
    for (const call of calls) {
      expect(call.value).toBe("");
      expect(call.options).toMatchObject({ path: "/", maxAge: 0 });
    }
    expect(calls.map((c) => c.name).sort()).toEqual(
      [
        `__Host-${SESSION_COOKIE}`,
        `__Host-${MFA_PENDING_COOKIE}`,
        `__Host-${SETUP_PENDING_COOKIE}`,
      ].sort(),
    );
  });
});

describe("cookie helpers outside production", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps the plain name and the /admin path so localhost over HTTP works", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const store = createCookieStore();
    cookies.mockResolvedValue(store);

    await setSessionCookie("jwt-token");

    const [call] = store.getSetCalls();
    expect(call?.name).toBe(SESSION_COOKIE);
    expect(call?.options).toMatchObject({ path: ADMIN_COOKIE_PATH, secure: false });
  });
});
