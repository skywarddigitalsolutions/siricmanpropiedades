import { describe, expect, it } from "vitest";
import {
  barrioFromDatosUtiles,
  findNeighborhoodByName,
  joinAddress,
  parseNormalizerResponse,
  sanitizeAddressQuery,
  splitAddress,
  titleCaseStreet,
} from "./address";

/** Trimmed from a real `normalizar?geocodificar=true` response (2026-10-01). */
const BOEDO_RESPONSE = {
  direccionesNormalizadas: [
    {
      altura: 123,
      cod_partido: "caba",
      coordenadas: { srid: 4326, x: "-58.417745", y: "-34.612817" },
      direccion: "BOEDO 123, CABA",
      nombre_calle: "BOEDO",
      nombre_calle_cruce: "",
      tipo: "calle_altura",
    },
    {
      altura: 123,
      cod_partido: "almirante_brown",
      coordenadas: { srid: 4326, x: -58.3329878751678, y: -34.8039808959732 },
      direccion: "Boedo 123, Almirante Brown",
      nombre_calle: "Boedo",
      nombre_calle_cruce: "",
      tipo: "calle_altura",
    },
  ],
};

describe("parseNormalizerResponse", () => {
  it("keeps only CABA results, with a nicely cased address and numeric coordinates", () => {
    expect(parseNormalizerResponse(BOEDO_RESPONSE)).toEqual([
      { address: "Boedo 123", lat: -34.612817, lon: -58.417745 },
    ]);
  });

  it("moves a trailing AV. to the front and keeps Spanish particles lowercase", () => {
    const result = parseNormalizerResponse({
      direccionesNormalizadas: [
        {
          altura: 3253,
          cod_partido: "caba",
          coordenadas: { x: "-58.410667", y: "-34.588556" },
          nombre_calle: "SANTA FE AV.",
          tipo: "calle_altura",
        },
        {
          altura: 1500,
          cod_partido: "caba",
          coordenadas: { x: "-58.393855", y: "-34.584184" },
          nombre_calle: "DEL LIBERTADOR AV.",
          tipo: "calle_altura",
        },
        {
          altura: 1500,
          cod_partido: "caba",
          coordenadas: { x: "-58.446302", y: "-34.564511" },
          nombre_calle: "11 DE SEPTIEMBRE DE 1888",
          tipo: "calle_altura",
        },
      ],
    });

    expect(result.map((item) => item.address)).toEqual([
      "Av. Santa Fe 3253",
      "Av. del Libertador 1500",
      "11 de Septiembre de 1888 1500",
    ]);
  });

  it("formats intersections", () => {
    const result = parseNormalizerResponse({
      direccionesNormalizadas: [
        {
          altura: null,
          cod_partido: "caba",
          coordenadas: { x: "-58.420959", y: "-34.603174" },
          nombre_calle: "CORRIENTES AV.",
          nombre_calle_cruce: "MEDRANO",
          tipo: "calle_y_calle",
        },
      ],
    });

    expect(result).toEqual([
      { address: "Av. Corrientes y Medrano", lat: -34.603174, lon: -58.420959 },
    ]);
  });

  it("drops street-only results, missing coordinates, duplicates and junk", () => {
    const result = parseNormalizerResponse({
      direccionesNormalizadas: [
        { cod_partido: "caba", coordenadas: null, nombre_calle: "CABILDO AV.", tipo: "calle" },
        { altura: 5, cod_partido: "caba", coordenadas: null, nombre_calle: "X", tipo: "calle_altura" },
        BOEDO_RESPONSE.direccionesNormalizadas[0],
        BOEDO_RESPONSE.direccionesNormalizadas[0],
        "nope",
      ],
    });

    expect(result).toHaveLength(1);
    expect(parseNormalizerResponse(null)).toEqual([]);
    expect(parseNormalizerResponse({ direccionesNormalizadas: [], errorMessage: "x" })).toEqual([]);
    expect(parseNormalizerResponse({ direccionesNormalizadas: "x" })).toEqual([]);
  });
});

describe("titleCaseStreet", () => {
  it("title-cases and lowercases particles after the first word", () => {
    expect(titleCaseStreet("JUAN B. JUSTO")).toBe("Juan B. Justo");
    expect(titleCaseStreet("AV. DE LOS INCAS")).toBe("Av. de los Incas");
  });
});

describe("sanitizeAddressQuery", () => {
  it("trims, collapses whitespace and rejects short queries", () => {
    expect(sanitizeAddressQuery("  avenida   boedo  123 ")).toBe("avenida boedo 123");
    expect(sanitizeAddressQuery("ab")).toBeNull();
    expect(sanitizeAddressQuery(null)).toBeNull();
  });

  it("rejects queries longer than 120 characters and control characters", () => {
    expect(sanitizeAddressQuery("a".repeat(121))).toBeNull();
    expect(sanitizeAddressQuery("a".repeat(120))).toHaveLength(120);
    expect(sanitizeAddressQuery("boedo\u0000 123")).toBeNull();
  });
});

describe("barrioFromDatosUtiles", () => {
  it("returns the barrio name or null when empty or malformed", () => {
    expect(barrioFromDatosUtiles({ comuna: "Comuna 5", barrio: "Almagro" })).toBe("Almagro");
    expect(barrioFromDatosUtiles({ barrio: "" })).toBeNull();
    expect(barrioFromDatosUtiles({})).toBeNull();
    expect(barrioFromDatosUtiles(null)).toBeNull();
  });
});

describe("findNeighborhoodByName", () => {
  const neighborhoods = [
    { id: "1", name: "Almagro" },
    { id: "2", name: "Nuñez" },
  ];

  it("matches ignoring case and accents", () => {
    expect(findNeighborhoodByName("ALMAGRO", neighborhoods)?.id).toBe("1");
    expect(findNeighborhoodByName("Núñez", neighborhoods)?.id).toBe("2");
  });

  it("returns undefined when the app has no such barrio", () => {
    expect(findNeighborhoodByName("Palermo", neighborhoods)).toBeUndefined();
  });
});

describe("splitAddress / joinAddress", () => {
  it("round-trips an address with a floor/unit appended after a comma", () => {
    expect(splitAddress("Boedo 123, 4° B")).toEqual({ base: "Boedo 123", unit: "4° B" });
    expect(joinAddress("Boedo 123", "4° B")).toBe("Boedo 123, 4° B");
  });

  it("handles no unit", () => {
    expect(splitAddress("Boedo 123")).toEqual({ base: "Boedo 123", unit: "" });
    expect(joinAddress("Boedo 123", "  ")).toBe("Boedo 123");
  });
});
