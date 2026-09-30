// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session/cookie-names";
import { config, proxy } from "./proxy";

function requestFor(path: string, cookie?: string): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("proxy", () => {
  it("redirects to /admin/login when no session cookie is present on a protected path", async () => {
    const response = await proxy(requestFor("/admin"));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe(
      "/admin/login",
    );
  });

  it("redirects to /admin when a session cookie is present and the target is /admin/login with no reason", async () => {
    const response = await proxy(
      requestFor("/admin/login", `${SESSION_COOKIE}=jwt-token`),
    );

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe(
      "/admin",
    );
  });

  it.each(["expired", "forbidden"])(
    "on /admin/login?reason=%s, passes through and expires all three cookies",
    async (reason) => {
      const response = await proxy(
        requestFor(
          `/admin/login?reason=${reason}`,
          `${SESSION_COOKIE}=stale-token`,
        ),
      );

      // NextResponse.next() carries no redirect location.
      expect(response.headers.get("location")).toBeNull();

      const setCookieHeaders = response.headers.getSetCookie
        ? response.headers.getSetCookie()
        : (response.headers.get("set-cookie")?.split(", ") ?? []);
      expect(setCookieHeaders).toHaveLength(3);
      for (const header of setCookieHeaders) {
        expect(header).toMatch(/Max-Age=0/i);
        expect(header).toMatch(/Path=\/admin/i);
      }
    },
  );

  it.each(["/admin/login", "/admin/mfa", "/admin/mfa/setup"])(
    "lets %s through without a session cookie",
    async (path) => {
      const response = await proxy(requestFor(path));

      expect(response.headers.get("location")).toBeNull();
    },
  );

  it("does not redirect a protected route away when a session cookie is present", async () => {
    const response = await proxy(
      requestFor("/admin", `${SESSION_COOKIE}=jwt-token`),
    );

    expect(response.headers.get("location")).toBeNull();
  });
});

describe("proxy config", () => {
  it("matches only /admin/:path*, not the public site root", () => {
    expect(config.matcher).toEqual(["/admin/:path*"]);
  });
});
