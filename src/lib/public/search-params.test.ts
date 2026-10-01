import { describe, expect, it } from "vitest";
import {
  EMPTY_SEARCH,
  buildSearchHref,
  countActiveFilters,
  effectiveCurrency,
  parseSearchParams,
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
      neighborhood: "palermo",
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
