import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_COOKIE_PATH,
  SESSION_COOKIE,
  cookieName,
  cookiePath,
} from "./cookie-names";

afterEach(() => vi.unstubAllEnvs());

describe("cookieName / cookiePath", () => {
  it("uses the __Host- prefix and path / in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(cookieName(SESSION_COOKIE)).toBe(`__Host-${SESSION_COOKIE}`);
    expect(cookiePath()).toBe("/");
  });

  it.each(["development", "test"])(
    "keeps the plain name and /admin path in %s",
    (env) => {
      vi.stubEnv("NODE_ENV", env);

      expect(cookieName(SESSION_COOKIE)).toBe(SESSION_COOKIE);
      expect(cookiePath()).toBe(ADMIN_COOKIE_PATH);
    },
  );
});
