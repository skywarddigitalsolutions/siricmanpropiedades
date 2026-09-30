// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { mockRequestHeaders } from "@/test/next-server";
import { getClientIp } from "./client-ip";

describe("getClientIp", () => {
  it("returns the IP from a single-entry X-Forwarded-For header", () => {
    const headers = mockRequestHeaders({ "x-forwarded-for": "203.0.113.7" });

    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("returns the rightmost entry of a comma-separated chain", () => {
    const headers = mockRequestHeaders({
      "x-forwarded-for": "198.51.100.1, 203.0.113.7, 192.0.2.55",
    });

    expect(getClientIp(headers)).toBe("192.0.2.55");
  });

  it("trims surrounding whitespace around the rightmost entry", () => {
    const headers = mockRequestHeaders({
      "x-forwarded-for": "198.51.100.1,   203.0.113.7   ",
    });

    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("accepts a full IPv6 address", () => {
    const headers = mockRequestHeaders({
      "x-forwarded-for": "2001:db8::8a2e:370:7334",
    });

    expect(getClientIp(headers)).toBe("2001:db8::8a2e:370:7334");
  });

  it("accepts an IPv4-mapped IPv6 address", () => {
    const headers = mockRequestHeaders({
      "x-forwarded-for": "::ffff:203.0.113.7",
    });

    expect(getClientIp(headers)).toBe("::ffff:203.0.113.7");
  });

  it("returns undefined and warns without the header value on an invalid IP", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const headers = mockRequestHeaders({
      "x-forwarded-for": "not-an-ip",
    });

    expect(getClientIp(headers)).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.join(" ")).not.toContain("not-an-ip");

    warnSpy.mockRestore();
  });

  it("returns undefined for an injected/garbage rightmost entry", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const headers = mockRequestHeaders({
      "x-forwarded-for": "203.0.113.7, <script>alert(1)</script>",
    });

    expect(getClientIp(headers)).toBeUndefined();

    warnSpy.mockRestore();
  });

  it("returns undefined when the header is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const headers = mockRequestHeaders();

    expect(getClientIp(headers)).toBeUndefined();

    warnSpy.mockRestore();
  });

  it("returns undefined when the header is empty", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const headers = mockRequestHeaders({ "x-forwarded-for": "" });

    expect(getClientIp(headers)).toBeUndefined();

    warnSpy.mockRestore();
  });
});
