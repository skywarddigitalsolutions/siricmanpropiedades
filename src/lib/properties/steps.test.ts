import { describe, expect, it } from "vitest";
import {
  FORM_STEP_BY_STEP,
  STEPS,
  STEP_FIELDS,
  parseStep,
  stepHref,
} from "./steps";

describe("steps", () => {
  it("lists the four guided steps in order", () => {
    expect(STEPS.map((step) => step.label)).toEqual([
      "Datos",
      "Fotos",
      "Descripción y extras",
      "Vista previa",
    ]);
  });

  it("parses the paso param and falls back to datos", () => {
    expect(parseStep("fotos")).toBe("fotos");
    expect(parseStep(["vista-previa", "x"])).toBe("vista-previa");
    expect(parseStep("nope")).toBe("datos");
    expect(parseStep(undefined)).toBe("datos");
  });

  it("builds the step href", () => {
    expect(stepHref("p1", "fotos")).toBe("/admin/propiedades/p1?paso=fotos");
  });

  it("maps form steps to their fields without overlap", () => {
    expect(FORM_STEP_BY_STEP).toEqual({ datos: "datos", descripcion: "extras" });
    const datos = new Set<string>(STEP_FIELDS.datos);
    expect(STEP_FIELDS.extras.some((field) => datos.has(field))).toBe(false);
    expect(STEP_FIELDS.datos).toEqual(
      expect.arrayContaining([
        "operation",
        "type",
        "title",
        "neighborhoodId",
        "address",
        "currency",
        "price",
        "rooms",
        "bedrooms",
        "bathrooms",
        "coveredArea",
        "totalArea",
        "age",
      ]),
    );
    expect(STEP_FIELDS.extras).toEqual(
      expect.arrayContaining(["description", "marketingTag", "featured", "hasWater"]),
    );
  });
});
