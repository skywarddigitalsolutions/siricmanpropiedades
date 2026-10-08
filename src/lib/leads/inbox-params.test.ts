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

  it("reads status, category and page, ignoring invalid values", () => {
    expect(parseInboxParams({ estado: "todas", categoria: "tasacion", pagina: "3" })).toEqual({
      status: "all",
      category: "appraisal",
      page: 3,
    });
    expect(parseInboxParams({ categoria: "busqueda" }).category).toBe("search");
    expect(parseInboxParams({ categoria: "administracion" }).category).toBe("management");
    expect(parseInboxParams({ categoria: "otras" }).category).toBe("other");
    expect(parseInboxParams({ estado: "x", categoria: "y", pagina: "0" })).toEqual({
      status: "new",
      page: 1,
    });
  });
});

describe("legacy tipo links", () => {
  it("maps old type links to their category", () => {
    expect(parseInboxParams({ tipo: "tasacion" }).category).toBe("appraisal");
    expect(parseInboxParams({ tipo: "propiedad" }).category).toBe("search");
    expect(parseInboxParams({ tipo: "contacto" }).category).toBeUndefined();
  });

  it("prefers the category param over tipo", () => {
    expect(parseInboxParams({ tipo: "tasacion", categoria: "otras" }).category).toBe("other");
  });
});

describe("toLeadFilters", () => {
  it("maps to the API query with pagination", () => {
    expect(toLeadFilters({ status: "contacted", category: "search", page: 2 }, 20)).toEqual({
      status: "contacted",
      category: "search",
      limit: 20,
      offset: 20,
    });
    expect(toLeadFilters({ status: "all", page: 1 }, 20)).toEqual({ limit: 20, offset: 0 });
  });
});

describe("buildInboxHref", () => {
  it("omits defaults and resets the page on filter changes", () => {
    expect(buildInboxHref({ status: "new", page: 1 })).toBe("/admin/consultas");
    expect(buildInboxHref({ status: "new", category: "appraisal", page: 3 }, { status: "closed" })).toBe(
      "/admin/consultas?estado=cerradas&categoria=tasacion",
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

const PROPERTY_ID = "3f2b8c1e-5a1d-4c0e-9b7a-1d2e3f4a5b6c";

describe("inbox search and property filter", () => {
  it("parses q and propiedad, dropping a malformed property id", () => {
    expect(parseInboxParams({ q: "  ana ", propiedad: PROPERTY_ID })).toEqual({
      status: "new",
      q: "ana",
      propertyId: PROPERTY_ID,
      page: 1,
    });
    expect(parseInboxParams({ propiedad: "nope", q: " " })).toEqual({ status: "new", page: 1 });
  });

  it("maps them to API filters", () => {
    expect(
      toLeadFilters({ status: "all", q: "ana", propertyId: PROPERTY_ID, page: 1 }, 20),
    ).toEqual({ q: "ana", propertyId: PROPERTY_ID, limit: 20, offset: 0 });
  });

  it("keeps them in the URL and resets the page on filter changes", () => {
    expect(buildInboxHref({ status: "new", q: "ana", propertyId: PROPERTY_ID, page: 3 }, { status: "all" })).toBe(
      `/admin/consultas?estado=todas&q=ana&propiedad=${PROPERTY_ID}`,
    );
    expect(buildInboxHref({ status: "new", q: "ana", page: 1 }, { page: 2 })).toBe(
      "/admin/consultas?q=ana&pagina=2",
    );
  });
});
