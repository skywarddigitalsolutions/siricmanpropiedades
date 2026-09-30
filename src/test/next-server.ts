import { expect } from "vitest";

/**
 * Test doubles for the Next.js server APIs used by server-only session code
 * (`next/headers`'s `cookies()`/`headers()`, `next/navigation`'s `redirect()`).
 *
 * Vitest cannot render async Server Components or run the real App Router
 * request lifecycle, so tests mock these modules directly and use the
 * fakes/helpers below as the mock implementation.
 */

export type FakeCookie = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export type FakeCookieStore = {
  get(name: string): { name: string; value: string } | undefined;
  has(name: string): boolean;
  set(name: string, value: string, options?: Record<string, unknown>): void;
  delete(name: string): void;
  /** Test-only inspection: every recorded `set()` call, most recent last. */
  getSetCalls(): FakeCookie[];
};

/**
 * Map-backed fake of the cookie store returned by `await cookies()`, with
 * `get`/`has`/`set`/`delete` plus a `getSetCalls()` inspection helper that
 * records the options passed to every `set()` call (httpOnly, maxAge, etc.).
 */
export function createCookieStore(
  initial: Record<string, string> = {},
): FakeCookieStore {
  const values = new Map<string, string>(Object.entries(initial));
  const setCalls: FakeCookie[] = [];

  return {
    get(name) {
      const value = values.get(name);
      return value === undefined ? undefined : { name, value };
    },
    has(name) {
      return values.has(name);
    },
    set(name, value, options) {
      values.set(name, value);
      setCalls.push({ name, value, options });
    },
    delete(name) {
      values.delete(name);
    },
    getSetCalls() {
      return setCalls;
    },
  };
}

/** Fake of the `Headers`-like object returned by `await headers()`. */
export function mockRequestHeaders(init: Record<string, string> = {}): Headers {
  return new Headers(init);
}

/**
 * Thrown by the mocked `redirect()` from `next/navigation`, mirroring how the
 * real `redirect()` works by throwing to interrupt rendering/action execution.
 */
export class RedirectError extends Error {
  constructor(readonly url: string) {
    super(`REDIRECT:${url}`);
    this.name = "RedirectError";
  }
}

/**
 * Awaits `promise`, asserting it rejects with a `RedirectError` targeting
 * `url`. Use with `vi.mock("next/navigation", () => ({ redirect: vi.fn((url) => { throw new RedirectError(url) }) }))`.
 */
export async function expectRedirect(
  promise: Promise<unknown>,
  url: string,
): Promise<void> {
  await expect(promise).rejects.toBeInstanceOf(RedirectError);
  await promise.catch((error: unknown) => {
    expect((error as RedirectError).url).toBe(url);
  });
}
