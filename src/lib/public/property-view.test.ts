import { describe, expect, it } from "vitest";
import { makePublicProperty } from "@/test/fixtures/public-property";
import {
  conditionLabels,
  dealStatusNotice,
  expensesLabel,
  propertyFacts,
  propertyLocation,
  propertyMap,
  propertyPriceLabel,
  propertySpecs,
  serviceLabels,
  tagLabel,
  whatsappInquiry,
} from "./property-view";

describe("propertyPriceLabel", () => {
  it("formats sales and adds /mes to rents", () => {
    expect(propertyPriceLabel(makePublicProperty())).toBe("USD 185.000");
    expect(
      propertyPriceLabel(makePublicProperty({ operation: "rent", currency: "ARS", price: 650000 })),
    ).toBe("$ 650.000 /mes");
  });
});

describe("expensesLabel", () => {
  it("shows expenses only when there are any", () => {
    expect(expensesLabel(makePublicProperty())).toBe("+ $ 145.000 expensas");
    expect(expensesLabel(makePublicProperty({ expenses: 0 }))).toBeNull();
    expect(expensesLabel(makePublicProperty({ expenses: null }))).toBeNull();
  });
});

describe("propertySpecs", () => {
  it("lists area, rooms, bedrooms and bathrooms with accessible labels", () => {
    expect(propertySpecs(makePublicProperty())).toEqual([
      { icon: "area", text: "78 m²", label: "78 m² totales" },
      { icon: "rooms", text: "3 amb.", label: "3 ambientes" },
      { icon: "bedrooms", text: "2", label: "2 dormitorios" },
      { icon: "bathrooms", text: "1", label: "1 baño" },
    ]);
  });

  it("skips zero values, rooms for shops and the garage icon for garages", () => {
    expect(
      propertySpecs(
        makePublicProperty({ type: "commercial", rooms: 1, bedrooms: 0, bathrooms: 1, hasGarage: true }),
      ).map((spec) => spec.icon),
    ).toEqual(["area", "bathrooms", "garage"]);
    expect(
      propertySpecs(
        makePublicProperty({ type: "garage", rooms: 0, bedrooms: 0, bathrooms: 0, hasGarage: true }),
      ).map((spec) => spec.icon),
    ).toEqual(["area"]);
  });
});

describe("tagLabel", () => {
  it("names marketing tags and hides none", () => {
    expect(tagLabel(makePublicProperty({ marketingTag: "opportunity" }))).toBe("Oportunidad");
    expect(tagLabel(makePublicProperty())).toBeNull();
  });
});

describe("dealStatusNotice", () => {
  it("describes reserved, sold and rented properties", () => {
    expect(dealStatusNotice(makePublicProperty())).toBeNull();
    expect(dealStatusNotice(makePublicProperty({ dealStatus: "reserved" }))).toEqual({
      label: "Reservada",
      tone: "reserved",
      available: true,
    });
    expect(dealStatusNotice(makePublicProperty({ dealStatus: "sold" }))).toEqual({
      label: "Vendida",
      tone: "closed",
      available: false,
    });
  });
});

describe("propertyLocation", () => {
  it("shows the exact address only when public", () => {
    expect(propertyLocation(makePublicProperty())).toEqual({
      label: "Gorriti 4800 · Palermo, CABA",
      exact: true,
    });
    expect(propertyLocation(makePublicProperty({ address: null }))).toEqual({
      label: "Palermo, CABA · zona aproximada",
      exact: false,
    });
  });
});

describe("propertyFacts", () => {
  it("lists every fact with readable values", () => {
    expect(
      propertyFacts(makePublicProperty({ age: 0, expenses: null, coveredArea: 0 })),
    ).toEqual([
      { icon: "area", label: "Sup. total", value: "78 m²" },
      { icon: "coveredArea", label: "Sup. cubierta", value: "—" },
      { icon: "rooms", label: "Ambientes", value: "3" },
      { icon: "bedrooms", label: "Dormitorios", value: "2" },
      { icon: "bathrooms", label: "Baños", value: "1" },
      { icon: "garage", label: "Cochera", value: "No" },
      { icon: "age", label: "Antigüedad", value: "A estrenar" },
      { icon: "expenses", label: "Expensas", value: "No tiene" },
    ]);
  });
});

describe("conditionLabels and serviceLabels", () => {
  it("lists only what applies", () => {
    expect(conditionLabels(makePublicProperty())).toEqual(["Apto crédito", "Acepta mascotas"]);
    expect(serviceLabels(makePublicProperty())).toEqual([
      "Agua corriente",
      "Gas natural",
      "Cloacas",
      "Electricidad",
    ]);
  });
});

describe("whatsappInquiry", () => {
  it("prefills a message naming the property", () => {
    const { message, href } = whatsappInquiry(makePublicProperty());

    expect(message).toBe(
      "Hola, me interesa la propiedad SP-0101 (Luminoso 3 ambientes con balcón al frente). ¿Podemos coordinar una visita?",
    );
    expect(href).toBe(`https://wa.me/5491138967363?text=${encodeURIComponent(message)}`);
  });
});

describe("propertyMap", () => {
  it("pins the exact address when it is public", () => {
    expect(propertyMap(makePublicProperty())).toEqual({
      query: "Gorriti 4800, Palermo, CABA",
      precision: "exact",
      label: "Gorriti 4800, Palermo",
    });
  });

  it("falls back to the barrio when the address is hidden", () => {
    const map = propertyMap(makePublicProperty({ address: null }));

    expect(map).toEqual({
      query: "Palermo, CABA",
      precision: "approximate",
      label: "Zona aproximada · Palermo",
    });
    expect(JSON.stringify(map)).not.toContain("Gorriti");
  });

  it("treats a blank address as hidden", () => {
    expect(propertyMap(makePublicProperty({ address: "   " })).precision).toBe("approximate");
  });
});
