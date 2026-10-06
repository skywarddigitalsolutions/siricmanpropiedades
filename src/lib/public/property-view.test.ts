import { describe, expect, it } from "vitest";
import { absoluteUrl } from "@/lib/site-url";
import { makePublicProperty } from "@/test/fixtures/public-property";
import {
  conditionLabels,
  dealStatusNotice,
  displayTitle,
  expensesLabel,
  propertyFacts,
  propertyLocation,
  propertyMap,
  propertyMapsHref,
  propertyPriceLabel,
  propertySpecs,
  amenityItems,
  serviceItems,
  tagLabel,
  inquiryMessage,
  whatsappInquiry,
} from "./property-view";

describe("propertyPriceLabel", () => {
  it("formats sales and adds /mes to rents", () => {
    expect(propertyPriceLabel(makePublicProperty())).toBe("US$ 185.000");
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
      label: "Palermo, CABA",
      exact: false,
    });
  });

  it("treats a blank address like a hidden one, as the map does", () => {
    const property = makePublicProperty({ address: "   " });
    expect(propertyLocation(property)).toEqual({ label: "Palermo, CABA", exact: false });
    expect(propertyMap(property).precision).toBe("approximate");
  });
});

describe("propertyFacts", () => {
  it("lists only the facts with data, starting with the type", () => {
    expect(propertyFacts(makePublicProperty())).toEqual([
      { label: "Tipo", value: "Departamento" },
      { label: "Superficie total", value: "78 m²" },
      { label: "Superficie cubierta", value: "72 m²" },
      { label: "Ambientes", value: "3" },
      { label: "Dormitorios", value: "2" },
      { label: "Baños", value: "1" },
      { label: "Antigüedad", value: "12 años" },
    ]);
  });

  it("drops empty values, shows the garage only when there is one, and never repeats expenses", () => {
    const facts = propertyFacts(
      makePublicProperty({ coveredArea: 0, bedrooms: 0, hasGarage: true, age: 0, expenses: 145000 }),
    );
    expect(facts.map((fact) => fact.label)).not.toContain("Superficie cubierta");
    expect(facts.map((fact) => fact.label)).not.toContain("Dormitorios");
    expect(facts.map((fact) => fact.label)).not.toContain("Expensas");
    expect(facts).toContainEqual({ label: "Cochera", value: "Sí" });
    expect(facts).toContainEqual({ label: "Antigüedad", value: "A estrenar" });
  });

  it("follows the property type, like the spec row", () => {
    const shop = propertyFacts(makePublicProperty({ type: "commercial" }));
    expect(shop.map((fact) => fact.label)).not.toContain("Ambientes");
    const garage = propertyFacts(makePublicProperty({ type: "garage", hasGarage: true }));
    expect(garage.map((fact) => fact.label)).not.toContain("Cochera");
    const land = propertyFacts(makePublicProperty({ type: "land", age: 0 }));
    expect(land.map((fact) => fact.label)).not.toContain("Antigüedad");
  });
});

describe("conditionLabels, serviceItems and amenityItems", () => {
  it("lists only what applies", () => {
    expect(conditionLabels(makePublicProperty())).toEqual(["Apto crédito", "Acepta mascotas"]);
    expect(serviceItems(makePublicProperty())).toEqual([
      { key: "water", label: "Agua corriente" },
      { key: "naturalGas", label: "Gas natural" },
      { key: "sewer", label: "Cloacas" },
      { key: "electricity", label: "Electricidad" },
    ]);
  });

  it("lists amenities in a fixed order, and none when the API sends none", () => {
    expect(amenityItems(makePublicProperty())).toEqual([]);
    expect(
      amenityItems(makePublicProperty({ amenities: { storage: true, pool: true, gym: false } })),
    ).toEqual([
      { key: "pool", label: "Pileta" },
      { key: "storage", label: "Baulera" },
    ]);
  });
});

describe("inquiryMessage", () => {
  it("names the property by its title, never by its code", () => {
    expect(inquiryMessage(makePublicProperty())).toBe(
      'Hola, me interesa "Luminoso 3 ambientes con balcón al frente". ¿Podemos coordinar una visita?',
    );
  });
});

describe("whatsappInquiry", () => {
  it("prefills a message with the title and the page link, never the code", () => {
    const property = makePublicProperty();
    const { message, href } = whatsappInquiry(property);

    expect(message).toBe(
      `${inquiryMessage(property)} ${absoluteUrl(`/propiedades/${property.slug}`)}`,
    );
    expect(message).not.toContain(property.code);
    expect(href).toBe(`https://wa.me/5491138967363?text=${encodeURIComponent(message)}`);
  });
});

describe("propertyMap", () => {
  it("pins the exact address when it is public", () => {
    expect(propertyMap(makePublicProperty())).toEqual({
      query: "Gorriti 4800, Palermo, CABA",
      precision: "exact",
    });
  });

  it("falls back to the barrio when the address is hidden", () => {
    const map = propertyMap(makePublicProperty({ address: null }));

    expect(map).toEqual({
      query: "Palermo, CABA",
      precision: "approximate",
    });
    expect(JSON.stringify(map)).not.toContain("Gorriti");
  });

  it("treats a blank address as hidden", () => {
    expect(propertyMap(makePublicProperty({ address: "   " })).precision).toBe("approximate");
  });
});

describe("displayTitle", () => {
  it("turns an ALL CAPS title into title case, keeping acronyms and connectors", () => {
    expect(displayTitle("PH AVENIDA BOEDO 123 FRENTE A LA PLAZA")).toBe(
      "PH Avenida Boedo 123 Frente a la Plaza",
    );
    expect(displayTitle("DEPARTAMENTO 3 AMBIENTES EN CABA")).toBe("Departamento 3 Ambientes en CABA");
    expect(displayTitle("AV. SANTA FE 1234 - PRECIO EN USD")).toBe("Av. Santa Fe 1234 - Precio en USD");
    expect(displayTitle("SEMI-PISO CON COCHERA")).toBe("Semi-Piso con Cochera");
  });

  it("leaves titles that are not all caps, or have no letters, untouched", () => {
    expect(displayTitle("Luminoso 3 ambientes con balcón")).toBe("Luminoso 3 ambientes con balcón");
    expect(displayTitle("Casa en PALERMO")).toBe("Casa en PALERMO");
    expect(displayTitle("123")).toBe("123");
    expect(displayTitle("PH")).toBe("PH");
  });
});

describe("propertyMapsHref", () => {
  it("links to a Google Maps search for the address or the barrio", () => {
    expect(propertyMapsHref("Gorriti 4800, Palermo, CABA")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Gorriti%204800%2C%20Palermo%2C%20CABA",
    );
  });
});
