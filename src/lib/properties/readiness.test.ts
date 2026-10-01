import { describe, expect, it } from "vitest";
import { MIN_DESCRIPTION_LENGTH, computeReadiness } from "./readiness";

const READY = {
  imageCount: 3,
  description: "x".repeat(MIN_DESCRIPTION_LENGTH),
  price: 120000,
};

describe("computeReadiness", () => {
  it("is ready with a photo, a long enough description and a price", () => {
    const result = computeReadiness(READY);

    expect(result.ready).toBe(true);
    expect(result.items.every((item) => item.done)).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("reports each missing requirement", () => {
    const result = computeReadiness({
      imageCount: 0,
      description: "corta",
      price: 0,
    });

    expect(result.ready).toBe(false);
    expect(result.items.map((item) => [item.id, item.done])).toEqual([
      ["photos", false],
      ["description", false],
      ["price", false],
    ]);
    expect(result.missing).toEqual([
      "Al menos una foto",
      "Descripción de 50 caracteres o más",
      "Precio cargado",
    ]);
  });

  it("trims the description and treats null as empty", () => {
    expect(
      computeReadiness({ ...READY, description: `  ${"x".repeat(49)}  ` }).ready,
    ).toBe(false);
    expect(computeReadiness({ ...READY, description: null }).ready).toBe(false);
  });
});
