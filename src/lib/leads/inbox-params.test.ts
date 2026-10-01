import { describe, expect, it } from "vitest";
import {
  buildInboxHref,
  formatLeadDate,
  leadSummary,
  parseInboxParams,
  toLeadFilters,
} from "./inbox-params";

describe("parseInboxParams", () => {
  it("defaults to new leads on page 1", () => {
    expect(parseInboxParams({})).toEqual({ status: "new", page: 1 });
  });

  it("reads status, type and page, ignoring invalid values", () => {
    expect(parseInboxParams({ estado: "todas", tipo: "tasacion", pagina: "3" })).toEqual({
      status: "all",
      type: "appraisal",
      page: 3,
    });
    expect(parseInboxParams({ estado: "x", tipo: "y", pagina: "0" })).toEqual({
      status: "new",
      page: 1,
    });
  });
});

describe("toLeadFilters", () => {
  it("maps to the API query with pagination", () => {
    expect(toLeadFilters({ status: "contacted", type: "contact", page: 2 }, 20)).toEqual({
      status: "contacted",
      type: "contact",
      limit: 20,
      offset: 20,
    });
    expect(toLeadFilters({ status: "all", page: 1 }, 20)).toEqual({ limit: 20, offset: 0 });
  });
});

describe("buildInboxHref", () => {
  it("omits defaults and resets the page on filter changes", () => {
    expect(buildInboxHref({ status: "new", page: 1 })).toBe("/admin/consultas");
    expect(buildInboxHref({ status: "new", type: "appraisal", page: 3 }, { status: "closed" })).toBe(
      "/admin/consultas?estado=cerradas&tipo=tasacion",
    );
    expect(buildInboxHref({ status: "all", page: 1 }, { page: 2 })).toBe(
      "/admin/consultas?estado=todas&pagina=2",
    );
  });
});

describe("formatLeadDate", () => {
  it("shows Buenos Aires local time", () => {
    expect(formatLeadDate("2026-09-30T15:05:00.000Z")).toBe("30/09 12:05");
  });
});

describe("leadSummary", () => {
  it("describes what the lead is about", () => {
    expect(
      leadSummary({
        type: "property_inquiry",
        property: { id: "p", code: "SP-0007", title: "Casa en Palermo", slug: "c" },
        topic: null,
      }),
    ).toBe("SP-0007 · Casa en Palermo");
    expect(leadSummary({ type: "contact", property: null, topic: "sell" })).toBe(
      "Contacto · Quiere vender o tasar",
    );
    expect(leadSummary({ type: "property_inquiry", property: null, topic: null })).toBe(
      "Consulta por propiedad (ya no publicada)",
    );
  });
});
