// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
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
  const pattern = new RegExp(`^${config.matcher[0]}$`);

  it("matches site pages and admin pages", () => {
    for (const path of ["/", "/propiedades/casa", "/admin", "/admin/login"]) {
      expect(pattern.test(path)).toBe(true);
    }
  });

  it("skips Next static assets and the favicon", () => {
    for (const path of ["/_next/static/chunks/a.js", "/_next/image", "/favicon.ico"]) {
      expect(pattern.test(path)).toBe(false);
    }
  });
});

describe("proxy security headers", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("sets a CSP with frame-ancestors 'self' on site pages", async () => {
    const response = await proxy(requestFor("/propiedades"));

    const csp = response.headers.get("content-security-policy") ?? "";
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
  });

  it("sets a nonce CSP, frame-ancestors 'none' and X-Frame-Options DENY on admin pages", async () => {
    const response = await proxy(requestFor("/admin/login"));

    const csp = response.headers.get("content-security-policy") ?? "";
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(response.headers.get("x-frame-options")).toBe("DENY");
  });

  it("uses a different nonce on every request", async () => {
    const nonceOf = async () =>
      (await proxy(requestFor("/admin/login"))).headers
        .get("content-security-policy")
        ?.match(/'nonce-([^']+)'/)?.[1];

    expect(await nonceOf()).not.toBe(await nonceOf());
  });
});

describe("proxy host routing", () => {
  afterEach(() => vi.unstubAllEnvs());

  function withAdminUrl() {
    vi.stubEnv("ADMIN_URL", "https://admin.example.com");
    vi.stubEnv("SITE_URL", "https://example.com");
  }

  function requestOn(host: string, path: string, cookie?: string): NextRequest {
    return new NextRequest(`https://${host}${path}`, {
      headers: { host, ...(cookie ? { cookie } : {}) },
    });
  }

  it("redirects /admin on the site host to the admin host with 308", async () => {
    withAdminUrl();
    const response = await proxy(requestOn("example.com", "/admin/propiedades?x=1"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://admin.example.com/admin/propiedades?x=1",
    );
  });

  it("redirects public paths on the admin host to the site with 308", async () => {
    withAdminUrl();
    const response = await proxy(requestOn("admin.example.com", "/propiedades"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://example.com/propiedades");
  });

  it("redirects the admin host root to /admin", async () => {
    withAdminUrl();
    const response = await proxy(requestOn("admin.example.com", "/"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://admin.example.com/admin");
  });

  it("keeps the auth gating on the admin host, redirecting to the admin origin", async () => {
    withAdminUrl();
    const response = await proxy(requestOn("admin.example.com", "/admin/propiedades"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://admin.example.com/admin/login",
    );
  });

  it("reads the __Host- session cookie in production", async () => {
    withAdminUrl();
    vi.stubEnv("NODE_ENV", "production");

    const withCookie = await proxy(
      requestOn(
        "admin.example.com",
        "/admin/propiedades",
        `__Host-${SESSION_COOKIE}=jwt`,
      ),
    );
    const legacyCookie = await proxy(
      requestOn("admin.example.com", "/admin/propiedades", `${SESSION_COOKIE}=jwt`),
    );

    expect(withCookie.headers.get("location")).toBeNull();
    expect(legacyCookie.status).toBe(307);
  });

  it("expires the __Host- cookies on Path=/ in production", async () => {
    withAdminUrl();
    vi.stubEnv("NODE_ENV", "production");

    const response = await proxy(
      requestOn("admin.example.com", "/admin/login?reason=expired"),
    );

    const headers = response.headers.getSetCookie();
    expect(headers).toHaveLength(3);
    for (const header of headers) {
      expect(header).toMatch(/^__Host-/);
      expect(header).toMatch(/Path=\/;/i);
      expect(header).toMatch(/Secure/i);
      expect(header).not.toMatch(/Domain=/i);
    }
  });

  it("does no host routing when ADMIN_URL is unset", async () => {
    const response = await proxy(requestOn("localhost:3000", "/propiedades"));

    expect(response.headers.get("location")).toBeNull();
  });
});
