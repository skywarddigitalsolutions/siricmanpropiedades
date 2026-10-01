import { describe, expect, it } from "vitest";
import { currencyForOperation, suggestTitle } from "./suggest";

describe("suggestTitle", () => {
  it("combines type, rooms and barrio", () => {
    expect(
      suggestTitle({ type: "apartment", neighborhoodName: "Palermo", rooms: "3" }),
    ).toBe("Departamento 3 ambientes en Palermo");
  });

  it("uses Monoambiente for a one-room apartment and singular for other types", () => {
    expect(
      suggestTitle({ type: "apartment", neighborhoodName: "Almagro", rooms: "1" }),
    ).toBe("Monoambiente en Almagro");
    expect(suggestTitle({ type: "house", neighborhoodName: "Núñez", rooms: "1" })).toBe(
      "Casa 1 ambiente en Núñez",
    );
  });

  it("skips rooms for types without them or when blank/invalid", () => {
    expect(suggestTitle({ type: "land", neighborhoodName: "Palermo", rooms: "4" })).toBe(
      "Terreno en Palermo",
    );
    expect(
      suggestTitle({ type: "apartment", neighborhoodName: "Palermo", rooms: "" }),
    ).toBe("Departamento en Palermo");
    expect(
      suggestTitle({ type: "apartment", neighborhoodName: "Palermo", rooms: "abc" }),
    ).toBe("Departamento en Palermo");
  });

  it("works without barrio and is empty without a type", () => {
    expect(suggestTitle({ type: "ph", neighborhoodName: "", rooms: "2" })).toBe(
      "PH 2 ambientes",
    );
    expect(suggestTitle({ type: "", neighborhoodName: "Palermo", rooms: "2" })).toBe("");
  });
});

describe("currencyForOperation", () => {
  it("defaults to USD for sales and ARS for rents", () => {
    expect(currencyForOperation("sale")).toBe("USD");
    expect(currencyForOperation("rent")).toBe("ARS");
    expect(currencyForOperation("")).toBeUndefined();
  });
});
