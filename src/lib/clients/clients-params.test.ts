import { describe, expect, it } from "vitest";
import {
  buildClientsHref,
  buildExportHref,
  formatClientDate,
  formatRelativeDate,
  parseClientsParams,
} from "./clients-params";

describe("parseClientsParams", () => {
  it("defaults to page 1 without a search", () => {
    expect(parseClientsParams({})).toEqual({ q: "", page: 1 });
  });

  it("trims the search and ignores invalid pages", () => {
    expect(parseClientsParams({ q: "  ana ", pagina: "3" })).toEqual({ q: "ana", page: 3 });
    expect(parseClientsParams({ q: ["a", "b"], pagina: "-1" })).toEqual({ q: "a", page: 1 });
  });
});

describe("hrefs", () => {
  it("builds the list href omitting defaults", () => {
    expect(buildClientsHref({ q: "", page: 1 })).toBe("/admin/clientes");
    expect(buildClientsHref({ q: "ana", page: 2 })).toBe("/admin/clientes?q=ana&pagina=2");
    expect(buildClientsHref({ q: "ana", page: 2 }, { page: 1 })).toBe("/admin/clientes?q=ana");
  });

  it("builds the export href keeping the search but not the page", () => {
    expect(buildExportHref({ q: "", page: 3 })).toBe("/admin/clientes/export");
    expect(buildExportHref({ q: "a&b", page: 3 })).toBe("/admin/clientes/export?q=a%26b");
  });
});

describe("dates", () => {
  it("formats an absolute date in Buenos Aires time", () => {
    expect(formatClientDate("2026-09-30T02:30:00.000Z")).toBe("29/09/2026");
  });

  it("formats a relative date in Spanish", () => {
    const now = new Date("2026-10-01T12:00:00.000Z");
    expect(formatRelativeDate("2026-10-01T11:59:40.000Z", now)).toBe("hace un momento");
    expect(formatRelativeDate("2026-10-01T09:00:00.000Z", now)).toBe("hace 3 horas");
    expect(formatRelativeDate("2026-09-29T12:00:00.000Z", now)).toBe("hace 2 días");
    expect(formatRelativeDate("2026-08-01T12:00:00.000Z", now)).toBe("hace 2 meses");
    expect(formatRelativeDate("2024-10-01T12:00:00.000Z", now)).toBe("hace 2 años");
  });
});
