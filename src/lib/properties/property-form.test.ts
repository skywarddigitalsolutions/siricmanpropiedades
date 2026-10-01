import { describe, expect, it } from "vitest";
import { STEP_FIELDS } from "./steps";
import {
  DEFAULT_FORM_VALUES,
  mapApiErrorToFields,
  parsePropertyForm,
  toFormValues,
  type UpdatePropertyFormInput,
} from "./property-form";
import type { CreatePropertyInput, Property } from "@/lib/api/properties";

type RawFields = Record<string, string | boolean | undefined>;

function buildFormData(fields: RawFields): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (typeof value === "boolean") {
      if (value) formData.set(key, "on");
    } else {
      formData.set(key, value);
    }
  }
  return formData;
}

/** A fully valid create-mode submission; tests override one field at a time. */
const VALID_FIELDS: RawFields = {
  operation: "sale",
  type: "apartment",
  title: "Departamento 3 ambientes en Palermo",
  description: "Luminoso, a metros del subte.",
  neighborhoodId: "n1",
  address: "Av. Santa Fe 3253",
  showExactAddress: true,
  currency: "USD",
  price: "150000",
  expenses: "25000",
  rooms: "3",
  bedrooms: "2",
  bathrooms: "1",
  hasGarage: true,
  coveredArea: "65",
  totalArea: "70",
  age: "5",
  creditEligible: true,
  petsAllowed: false,
  immediateAvailability: true,
  marketingTag: "new",
  featured: true,
  hasWater: true,
  hasNaturalGas: true,
  hasSewer: true,
  hasElectricity: true,
  hasInternet: false,
};

describe("parsePropertyForm", () => {
  it("parses a fully valid create submission into a CreatePropertyInput", () => {
    const result = parsePropertyForm(buildFormData(VALID_FIELDS));

    expect(result).toEqual({
      input: {
        operation: "sale",
        type: "apartment",
        title: "Departamento 3 ambientes en Palermo",
        description: "Luminoso, a metros del subte.",
        neighborhoodId: "n1",
        address: "Av. Santa Fe 3253",
        showExactAddress: true,
        currency: "USD",
        price: 150000,
        expenses: 25000,
        rooms: 3,
        bedrooms: 2,
        bathrooms: 1,
        hasGarage: true,
        coveredArea: 65,
        totalArea: 70,
        age: 5,
        creditEligible: true,
        petsAllowed: false,
        immediateAvailability: true,
        marketingTag: "new",
        featured: true,
        hasWater: true,
        hasNaturalGas: true,
        hasSewer: true,
        hasElectricity: true,
        hasInternet: false,
      } satisfies CreatePropertyInput,
    });
  });

  it("maps an absent checkbox to false", () => {
    const result = parsePropertyForm(
      buildFormData({ ...VALID_FIELDS, hasGarage: undefined, featured: undefined }),
    );

    expect("input" in result && result.input).toMatchObject({
      hasGarage: false,
      featured: false,
    });
  });

  it("omits empty optional description/expenses in create mode", () => {
    const result = parsePropertyForm(
      buildFormData({ ...VALID_FIELDS, description: "", expenses: "" }),
    );

    expect("input" in result).toBe(true);
    const input = (result as { input: CreatePropertyInput }).input;
    expect("description" in input).toBe(false);
    expect("expenses" in input).toBe(false);
  });

  it("clears empty optional description/expenses to null in edit mode", () => {
    const result = parsePropertyForm(
      buildFormData({ ...VALID_FIELDS, description: "", expenses: "" }),
      { mode: "edit" },
    );

    expect("input" in result).toBe(true);
    const input = (result as { input: UpdatePropertyFormInput }).input;
    expect(input.description).toBeNull();
    expect(input.expenses).toBeNull();
  });

  describe("number parsing (es-AR conventions)", () => {
    it.each([
      ["120000", 120000],
      ["120.000", 120000],
      ["1.234.567", 1234567],
      ["120000,50", 120000.5],
      ["120.000,50", 120000.5],
      ["150000.5", 150000.5],
    ])("parses price %s as %f", (raw, expected) => {
      const result = parsePropertyForm(buildFormData({ ...VALID_FIELDS, price: raw }));
      expect("input" in result).toBe(true);
      expect((result as { input: CreatePropertyInput }).input.price).toBe(expected);
    });

    it("rejects a malformed number", () => {
      const result = parsePropertyForm(
        buildFormData({ ...VALID_FIELDS, price: "12x000" }),
      );
      expect("fieldErrors" in result && result.fieldErrors.price).toBeTruthy();
    });
  });

  describe("required field validation", () => {
    it.each([
      "operation",
      "type",
      "neighborhoodId",
      "currency",
      "address",
      "title",
      "price",
      "rooms",
      "bedrooms",
      "bathrooms",
      "coveredArea",
      "totalArea",
      "age",
    ])("reports an error when %s is missing", (field) => {
      const result = parsePropertyForm(
        buildFormData({ ...VALID_FIELDS, [field]: "" }),
      );
      expect("fieldErrors" in result).toBe(true);
      expect(
        (result as { fieldErrors: Record<string, string> }).fieldErrors[field],
      ).toBeTruthy();
    });
  });

  it("rejects a title shorter than 5 characters", () => {
    const result = parsePropertyForm(buildFormData({ ...VALID_FIELDS, title: "Casa" }));
    expect("fieldErrors" in result && result.fieldErrors.title).toBeTruthy();
  });

  it("rejects a price that is not positive", () => {
    const result = parsePropertyForm(buildFormData({ ...VALID_FIELDS, price: "0" }));
    expect("fieldErrors" in result && result.fieldErrors.price).toBeTruthy();
  });

  it("rejects a price with more than 2 decimals", () => {
    const result = parsePropertyForm(
      buildFormData({ ...VALID_FIELDS, price: "150000,123" }),
    );
    expect("fieldErrors" in result && result.fieldErrors.price).toBeTruthy();
  });

  it("rejects negative expenses", () => {
    const result = parsePropertyForm(
      buildFormData({ ...VALID_FIELDS, expenses: "-10" }),
    );
    expect("fieldErrors" in result && result.fieldErrors.expenses).toBeTruthy();
  });

  it("rejects a non-integer rooms value", () => {
    const result = parsePropertyForm(buildFormData({ ...VALID_FIELDS, rooms: "2.5" }));
    expect("fieldErrors" in result && result.fieldErrors.rooms).toBeTruthy();
  });

  it("rejects rooms above the 0-50 range", () => {
    const result = parsePropertyForm(buildFormData({ ...VALID_FIELDS, rooms: "51" }));
    expect("fieldErrors" in result && result.fieldErrors.rooms).toBeTruthy();
  });

  it("accepts age 0 (a estrenar)", () => {
    const result = parsePropertyForm(buildFormData({ ...VALID_FIELDS, age: "0" }));
    expect("input" in result).toBe(true);
  });

  it("rejects age above 300", () => {
    const result = parsePropertyForm(buildFormData({ ...VALID_FIELDS, age: "301" }));
    expect("fieldErrors" in result && result.fieldErrors.age).toBeTruthy();
  });

  it("rejects a description longer than 5000 characters", () => {
    const result = parsePropertyForm(
      buildFormData({ ...VALID_FIELDS, description: "a".repeat(5001) }),
    );
    expect("fieldErrors" in result && result.fieldErrors.description).toBeTruthy();
  });

  it("reports multiple field errors at once", () => {
    const result = parsePropertyForm(
      buildFormData({ ...VALID_FIELDS, operation: "", title: "x" }),
    );
    expect("fieldErrors" in result).toBe(true);
    const { fieldErrors } = result as { fieldErrors: Record<string, string> };
    expect(fieldErrors.operation).toBeTruthy();
    expect(fieldErrors.title).toBeTruthy();
  });
});

describe("mapApiErrorToFields", () => {
  it("maps a known DTO field name to that field's key", () => {
    const fieldErrors = mapApiErrorToFields([
      "price must be a positive number",
    ]);
    expect(fieldErrors.price).toBe("price must be a positive number");
  });

  it("maps multiple known fields independently", () => {
    const fieldErrors = mapApiErrorToFields([
      "title must be longer than or equal to 5 characters",
      "expenses must not be less than 0",
    ]);
    expect(fieldErrors.title).toBe(
      "title must be longer than or equal to 5 characters",
    );
    expect(fieldErrors.expenses).toBe("expenses must not be less than 0");
  });

  it("maps the back's rejected operation change to the operation field in Spanish", () => {
    const fieldErrors = mapApiErrorToFields([
      'Cannot change operation to "rent" while the property is "sold"; set the deal status to available or reserved first',
    ]);
    expect(fieldErrors.operation).toBe(
      "No se puede cambiar la operación de una propiedad vendida o alquilada. Primero pasala a Disponible o Reservada.",
    );
    expect(fieldErrors.general).toBeUndefined();
  });

  it("buckets an unrecognized field into general", () => {
    const fieldErrors = mapApiErrorToFields(["Neighborhood not found"]);
    expect(fieldErrors.general).toBe("Neighborhood not found");
    expect(fieldErrors.price).toBeUndefined();
  });
});

describe("toFormValues", () => {
  function makeProperty(overrides: Partial<Property> = {}): Property {
    return {
      id: "p1",
      code: "SP-0001",
      slug: "casa-en-palermo",
      operation: "sale",
      type: "house",
      title: "Casa en Palermo",
      description: null,
      neighborhood: { id: "n1", name: "Palermo", slug: "palermo", createdAt: "2024-01-01" },
      address: "Av. Siempre Viva 123",
      showExactAddress: true,
      currency: "USD",
      price: 150000,
      expenses: null,
      rooms: 4,
      bedrooms: 3,
      bathrooms: 2,
      hasGarage: true,
      coveredArea: 120,
      totalArea: 150,
      age: 10,
      creditEligible: false,
      petsAllowed: true,
      immediateAvailability: true,
      marketingTag: "none",
      featured: false,
      hasWater: true,
      hasNaturalGas: true,
      hasSewer: true,
      hasElectricity: true,
      hasInternet: true,
      publicationStatus: "published",
      dealStatus: "available",
      firstPublishedAt: "2024-02-01",
      createdAt: "2024-01-15",
      updatedAt: "2024-02-01",
      ...overrides,
    };
  }

  it("converts a Property into string/boolean form values", () => {
    const values = toFormValues(makeProperty());

    expect(values).toMatchObject({
      operation: "sale",
      type: "house",
      title: "Casa en Palermo",
      description: "",
      neighborhoodId: "n1",
      address: "Av. Siempre Viva 123",
      showExactAddress: true,
      currency: "USD",
      price: "150000",
      expenses: "",
      rooms: "4",
      bedrooms: "3",
      bathrooms: "2",
      hasGarage: true,
      coveredArea: "120",
      totalArea: "150",
      age: "10",
    });
  });

  it("preserves a non-null description and expenses as plain strings", () => {
    const values = toFormValues(
      makeProperty({ description: "Hermosa vista", expenses: 25000 }),
    );

    expect(values.description).toBe("Hermosa vista");
    expect(values.expenses).toBe("25000");
  });
});

describe("parsePropertyForm with only (per-step saves)", () => {
  function fd(fields: Record<string, string>) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) formData.set(key, value);
    return formData;
  }

  it("validates and returns only the requested fields (extras step)", () => {
    const result = parsePropertyForm(
      fd({ description: "Una descripción", marketingTag: "new", hasWater: "on" }),
      { mode: "edit", only: STEP_FIELDS.extras },
    );

    expect("input" in result).toBe(true);
    if (!("input" in result)) return;
    expect(result.input).toEqual(
      expect.objectContaining({
        description: "Una descripción",
        marketingTag: "new",
        hasWater: true,
      }),
    );
    expect(result.input).not.toHaveProperty("operation");
    expect(result.input).not.toHaveProperty("price");
    expect(result.input).not.toHaveProperty("title");
    expect(result.input).not.toHaveProperty("hasGarage");
  });

  it("does not complain about required fields outside the step", () => {
    const result = parsePropertyForm(fd({ marketingTag: "none" }), {
      mode: "edit",
      only: STEP_FIELDS.extras,
    });

    expect("fieldErrors" in result).toBe(false);
  });

  it("still reports errors for fields inside the step (datos)", () => {
    const result = parsePropertyForm(fd({ title: "ab", marketingTag: "none" }), {
      mode: "edit",
      only: STEP_FIELDS.datos,
    });

    expect("fieldErrors" in result).toBe(true);
    if (!("fieldErrors" in result)) return;
    expect(result.fieldErrors.title).toBeDefined();
    expect(result.fieldErrors.price).toBeDefined();
    expect(result.fieldErrors).not.toHaveProperty("marketingTag");
  });

  it("clears the description with null when the extras step sends it empty", () => {
    const result = parsePropertyForm(fd({ description: "", marketingTag: "none" }), {
      mode: "edit",
      only: STEP_FIELDS.extras,
    });

    expect("input" in result && result.input.description).toBeNull();
  });

  it("defaults a brand-new form to USD", () => {
    expect(DEFAULT_FORM_VALUES.currency).toBe("USD");
  });
});
