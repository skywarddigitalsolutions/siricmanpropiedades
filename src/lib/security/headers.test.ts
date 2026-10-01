// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildCsp, getImgSources, getStaticSecurityHeaders } from "./headers";

function directive(csp: string, name: string): string | undefined {
  return csp
    .split(";")
    .map((part) => part.trim())
    .find((part) => part === name || part.startsWith(`${name} `));
}

describe("buildCsp", () => {
  const base = { isDev: false, isAdmin: false, imgSources: ["https://api.example.com"] };

  it("builds the public site policy", () => {
    const csp = buildCsp(base);

    expect(directive(csp, "default-src")).toBe("default-src 'self'");
    expect(directive(csp, "img-src")).toBe(
      "img-src 'self' data: blob: https://api.example.com",
    );
    expect(directive(csp, "frame-src")).toBe(
      "frame-src https://www.google.com https://maps.google.com",
    );
    expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'self'");
    expect(directive(csp, "base-uri")).toBe("base-uri 'self'");
    expect(directive(csp, "form-action")).toBe("form-action 'self'");
    expect(directive(csp, "object-src")).toBe("object-src 'none'");
    expect(directive(csp, "script-src")).toBe("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("forbids framing on admin pages", () => {
    const csp = buildCsp({ ...base, isAdmin: true });

    expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
  });

  it("uses the nonce with strict-dynamic when one is given", () => {
    const csp = buildCsp({ ...base, nonce: "abc123" });

    expect(directive(csp, "script-src")).toBe(
      "script-src 'self' 'nonce-abc123' 'strict-dynamic'",
    );
    expect(directive(csp, "style-src")).toBe("style-src 'self' 'unsafe-inline'");
  });

  it("allows eval and websockets only in development", () => {
    const dev = buildCsp({ ...base, isDev: true });

    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    expect(directive(dev, "connect-src")).toContain("ws:");
    expect(directive(buildCsp(base), "connect-src")).toBe("connect-src 'self'");
  });
});

describe("getImgSources", () => {
  it("allows any http(s) image in development", () => {
    expect(getImgSources({ isDev: true })).toEqual(["http:", "https:"]);
  });

  it("derives the api origin from SITE_URL in production", () => {
    expect(
      getImgSources({ isDev: false, siteUrl: "https://siricmanpropiedades.com.ar" }),
    ).toEqual(["https://api.siricmanpropiedades.com.ar"]);
    expect(
      getImgSources({ isDev: false, siteUrl: "https://www.example.com/" }),
    ).toEqual(["https://api.example.com"]);
  });

  it("prefers an explicit MEDIA_ORIGIN", () => {
    expect(
      getImgSources({
        isDev: false,
        siteUrl: "https://example.com",
        mediaOrigin: "https://cdn.example.com/media",
      }),
    ).toEqual(["https://cdn.example.com"]);
  });

  it("falls back to https: when no usable origin exists", () => {
    expect(getImgSources({ isDev: false })).toEqual(["https:"]);
    expect(getImgSources({ isDev: false, siteUrl: "http://localhost:3000" })).toEqual([
      "https:",
    ]);
  });
});

describe("getStaticSecurityHeaders", () => {
  it("includes the baseline headers and HSTS in production", () => {
    const headers = Object.fromEntries(
      getStaticSecurityHeaders({ isProduction: true }).map((h) => [h.key, h.value]),
    );

    expect(headers).toEqual({
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    });
  });

  it("omits HSTS outside production", () => {
    const keys = getStaticSecurityHeaders({ isProduction: false }).map((h) => h.key);

    expect(keys).not.toContain("Strict-Transport-Security");
    expect(keys).toContain("X-Content-Type-Options");
  });
});
