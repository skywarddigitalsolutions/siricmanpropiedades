import { describe, expect, it } from "vitest";
import {
  EMPTY_SEARCH,
  activeFilters,
  buildSearchHref,
  canonicalHref,
  countActiveFilters,
  effectiveCurrency,
  isCanonicalQuery,
  parseSearchParams,
  resultsSeo,
  resultsTitle,
  toApiFilters,
} from "./search-params";

describe("parseSearchParams", () => {
  it("reads every Spanish param into a typed search state", () => {
    expect(
      parseSearchParams({
        operacion: "alquiler",
        tipo: "departamento",
        barrio: "palermo",
        ambientes: "3",
        dormitorios: "2",
        banos: "1",
        cochera: "1",
        credito: "1",
        mascotas: "1",
        moneda: "ARS",
        desde: "300.000",
        hasta: "900000",
        orden: "menor-precio",
        pagina: "2",
        codigo: " sp-0007 ",
      }),
    ).toEqual({
      operation: "rent",
      type: "apartment",
      neighborhoods: ["palermo"],
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      garage: true,
      credit: true,
      pets: true,
      currency: "ARS",
      priceMin: 300000,
      priceMax: 900000,
      sort: "menor-precio",
      page: 2,
      code: "SP-0007",
    });
  });

  it("ignores unknown or out-of-range values instead of failing", () => {
    expect(
      parseSearchParams({
        operacion: "permuta",
        tipo: "castillo",
        barrio: "../etc",
        ambientes: "9",
        dormitorios: "-1",
        moneda: "EUR",
        orden: "azar",
        pagina: "0",
        cochera: "si",
      }),
    ).toEqual(EMPTY_SEARCH);
  });

  it("uses the first value of repeated params and swaps an inverted price range", () => {
    const state = parseSearchParams({
      operacion: ["venta", "alquiler"],
      desde: "200000",
      hasta: "100000",
    });

    expect(state.operation).toBe("sale");
    expect([state.priceMin, state.priceMax]).toEqual([100000, 200000]);
  });
});

describe("multi-barrio", () => {
  const cb = (barrio: string) => parseSearchParams({ barrio }).neighborhoods;

  it("parses comma-separated slugs, dropping invalid and duplicated ones", () => {
    expect(cb("palermo,belgrano")).toEqual(["palermo", "belgrano"]);
    expect(cb("palermo")).toEqual(["palermo"]);
    expect(cb("palermo,../etc,belgrano,palermo,")).toEqual(["palermo", "belgrano"]);
    expect(cb("../etc")).toBeUndefined();
  });

  it("keeps at most 10 barrios", () => {
    const slugs = Array.from({ length: 12 }, (_, i) => `barrio-${i}`);
    expect(cb(slugs.join(","))).toEqual(slugs.slice(0, 10));
  });

  it("serializes with plain commas and sends them to the API as `neighborhood`", () => {
    const state = parseSearchParams({ operacion: "venta", barrio: "palermo,belgrano" });
    expect(buildSearchHref(state)).toBe("/propiedades?operacion=venta&barrio=palermo,belgrano");
    expect(toApiFilters(state, 12).neighborhood).toBe("palermo,belgrano");
    expect(toApiFilters(parseSearchParams({ barrio: "palermo" }), 12).neighborhood).toBe("palermo");
  });

  it("treats the comma URL as canonical", () => {
    const raw = { barrio: "palermo,belgrano" };
    expect(isCanonicalQuery(raw, parseSearchParams(raw))).toBe(true);
    const messy = { barrio: "palermo,belgrano,palermo" };
    expect(isCanonicalQuery(messy, parseSearchParams(messy))).toBe(false);
  });

  it("lists one active filter per barrio, each removing only itself", () => {
    const state = parseSearchParams({ operacion: "venta", barrio: "palermo,belgrano" });
    const filters = activeFilters(state, [
      { id: "1", name: "Palermo", slug: "palermo" },
      { id: "2", name: "Belgrano", slug: "belgrano" },
    ]);
    expect(filters.map((f) => f.label)).toEqual(["Palermo", "Belgrano"]);
    expect(filters[0].removeHref).toBe("/propiedades?operacion=venta&barrio=belgrano");
    expect(filters[1].removeHref).toBe("/propiedades?operacion=venta&barrio=palermo");
  });

  it("only indexes the single-barrio case", () => {
    const state = parseSearchParams({ barrio: "palermo,belgrano" });
    expect(resultsSeo(state)).toEqual({ title: "Propiedades en CABA", indexable: false });
  });
});

describe("toApiFilters", () => {
  it("maps the state to the back's query with pagination", () => {
    const filters = toApiFilters(
      parseSearchParams({ operacion: "venta", ambientes: "5", cochera: "1", pagina: "3" }),
      12,
    );

    expect(filters).toEqual({
      operation: "sale",
      minRooms: 5,
      hasGarage: true,
      sort: "newest",
      limit: 12,
      offset: 24,
    });
  });

  it("picks the usual currency when sorting or filtering by price without one", () => {
    expect(toApiFilters(parseSearchParams({ orden: "mayor-precio" }), 12)).toMatchObject({
      sort: "price_desc",
      currency: "USD",
    });
    expect(
      toApiFilters(parseSearchParams({ operacion: "alquiler", hasta: "800000" }), 12),
    ).toMatchObject({ currency: "ARS", priceMax: 800000 });
  });

  it("forwards a code lookup", () => {
    expect(toApiFilters(parseSearchParams({ codigo: "sp-0007" }), 12).code).toBe("SP-0007");
  });
});

describe("effectiveCurrency", () => {
  it("is undefined when price plays no role", () => {
    expect(effectiveCurrency(parseSearchParams({ operacion: "venta" }))).toBeUndefined();
  });

  it("respects an explicit currency", () => {
    expect(
      effectiveCurrency(parseSearchParams({ moneda: "ARS", orden: "menor-precio" })),
    ).toBe("ARS");
  });
});

describe("buildSearchHref", () => {
  it("serializes in a stable order and omits defaults", () => {
    const state = parseSearchParams({
      orden: "recientes",
      pagina: "1",
      barrio: "palermo",
      operacion: "venta",
    });

    expect(buildSearchHref(state)).toBe("/propiedades?operacion=venta&barrio=palermo");
  });

  it("applies a patch and resets the page unless the patch sets it", () => {
    const state = parseSearchParams({ operacion: "venta", pagina: "4" });

    expect(buildSearchHref(state, { type: "house" })).toBe(
      "/propiedades?operacion=venta&tipo=casa",
    );
    expect(buildSearchHref(state, { page: 5 })).toBe(
      "/propiedades?operacion=venta&pagina=5",
    );
  });

  it("clears values patched to undefined or false", () => {
    const state = parseSearchParams({ operacion: "venta", cochera: "1", tipo: "ph" });

    expect(buildSearchHref(state, { garage: false, type: undefined })).toBe(
      "/propiedades?operacion=venta",
    );
  });

  it("returns the bare path for an empty search", () => {
    expect(buildSearchHref(EMPTY_SEARCH)).toBe("/propiedades");
  });
});

describe("countActiveFilters", () => {
  it("counts sheet filters but not operation or barrio", () => {
    const state = parseSearchParams({
      operacion: "venta",
      barrio: "palermo",
      tipo: "casa",
      ambientes: "3",
      credito: "1",
      desde: "100000",
      hasta: "200000",
    });

    expect(countActiveFilters(state)).toBe(4);
  });
});

describe("resultsTitle", () => {
  it("pluralizes and names the operation", () => {
    expect(resultsTitle(1, undefined)).toBe("1 propiedad");
    expect(resultsTitle(12, "sale")).toBe("12 propiedades en venta");
    expect(resultsTitle(0, "rent")).toBe("0 propiedades en alquiler");
  });
});

describe("isCanonicalQuery", () => {
  it("keeps the page as part of the canonical URL", () => {
    const raw = { operacion: "venta", pagina: "2" };

    expect(isCanonicalQuery(raw, parseSearchParams(raw))).toBe(true);
    expect(canonicalHref(parseSearchParams(raw))).toBe("/propiedades?operacion=venta&pagina=2");
  });

  it("accepts the URL built for the same state, in any key order", () => {
    const raw = { barrio: "palermo", operacion: "venta" };

    expect(isCanonicalQuery(raw, parseSearchParams(raw))).toBe(true);
  });

  it("rejects empty, invalid or default params so the page can redirect", () => {
    for (const raw of [
      { operacion: "", barrio: "palermo" },
      { operacion: "permuta" },
      { orden: "recientes" },
      { pagina: "1" },
      { desde: "200", hasta: "100" },
    ]) {
      expect(isCanonicalQuery(raw, parseSearchParams(raw))).toBe(false);
    }
  });
});

describe("resultsSeo", () => {
  it("names type, operation and barrio, and indexes those combinations", () => {
    expect(
      resultsSeo(parseSearchParams({ tipo: "departamento", operacion: "venta" }), "Palermo"),
    ).toEqual({
      title: "Departamentos en venta en Palermo",
      indexable: true,
    });
    expect(resultsSeo(parseSearchParams({ operacion: "alquiler" }))).toEqual({
      title: "Propiedades en alquiler en CABA",
      indexable: true,
    });
  });

  it("does not index pages with other filters or beyond page 1", () => {
    expect(resultsSeo(parseSearchParams({ ambientes: "3" })).indexable).toBe(false);
    expect(resultsSeo(parseSearchParams({ pagina: "2" })).indexable).toBe(false);
    expect(resultsSeo(parseSearchParams({ codigo: "SP-1" })).indexable).toBe(false);
  });
});

describe("activeFilters", () => {
  const neighborhoods = [{ id: "1", name: "Palermo", slug: "palermo" }];

  it("is empty for a bare search", () => {
    expect(activeFilters(EMPTY_SEARCH, neighborhoods)).toEqual([]);
  });

  it("describes each active filter with the URL that removes only it", () => {
    const state = parseSearchParams({
      operacion: "venta",
      barrio: "palermo",
      tipo: "departamento",
      ambientes: "3",
      moneda: "USD",
      desde: "100000",
      hasta: "200000",
      cochera: "1",
      orden: "menor-precio",
    });
    const filters = activeFilters(state, neighborhoods);
    expect(filters.map((f) => f.label)).toEqual([
      "Palermo",
      "Departamento",
      "3 ambientes",
      "Cochera",
      "US$ 100.000 – US$ 200.000",
    ]);
    const palermo = filters[0];
    expect(palermo.removeHref).toBe(
      "/propiedades?operacion=venta&tipo=departamento&ambientes=3&cochera=1&moneda=USD&desde=100000&hasta=200000&orden=menor-precio",
    );
    expect(filters[4].removeHref).not.toContain("desde");
    expect(filters[4].removeHref).not.toContain("hasta");
  });

  it("labels open-ended price ranges and falls back to the slug", () => {
    const state = parseSearchParams({ barrio: "otro-barrio", desde: "50000", rooms: "9" });
    expect(activeFilters(state, []).map((f) => f.label)).toEqual([
      "otro-barrio",
      "Desde US$ 50.000",
    ]);
  });
});
