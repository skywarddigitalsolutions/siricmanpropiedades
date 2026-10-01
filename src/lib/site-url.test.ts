import { afterEach, describe, expect, it, vi } from "vitest";
import { absoluteUrl, getSiteUrl } from "./site-url";

afterEach(() => vi.unstubAllEnvs());

describe("getSiteUrl", () => {
  it("uses SITE_URL without a trailing slash", () => {
    vi.stubEnv("SITE_URL", "https://siricman.com.ar/");
    expect(getSiteUrl()).toBe("https://siricman.com.ar");
  });

  it("falls back to localhost when SITE_URL is missing or invalid", () => {
    vi.stubEnv("SITE_URL", "");
    expect(getSiteUrl()).toBe("http://localhost:3000");
    vi.stubEnv("SITE_URL", "not a url");
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});

describe("absoluteUrl", () => {
  it("joins a path to the site URL", () => {
    vi.stubEnv("SITE_URL", "https://siricman.com.ar");
    expect(absoluteUrl("/propiedades/casa")).toBe("https://siricman.com.ar/propiedades/casa");
  });
});
