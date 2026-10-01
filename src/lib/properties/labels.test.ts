import { describe, expect, it } from "vitest";
import {
  CURRENCIES,
  DEAL_STATUSES,
  MARKETING_TAGS,
  OPERATIONS,
  PROPERTY_TYPES,
  PUBLICATION_STATUSES,
} from "./enums";
import {
  DEAL_STATUS_LABELS,
  MARKETING_TAG_LABELS,
  OPERATION_LABELS,
  PROPERTY_TYPE_LABELS,
  PUBLICATION_STATUS_LABELS,
  allowedDealStatuses,
  currencySymbol,
  formatPrice,
} from "./labels";

describe("enum labels", () => {
  it("has a non-empty Spanish label for every operation", () => {
    for (const operation of OPERATIONS) {
      expect(OPERATION_LABELS[operation]).toBeTruthy();
    }
  });

  it("has a non-empty Spanish label for every property type", () => {
    for (const type of PROPERTY_TYPES) {
      expect(PROPERTY_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it("has a non-empty Spanish label for every publication status", () => {
    for (const status of PUBLICATION_STATUSES) {
      expect(PUBLICATION_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it("has a non-empty Spanish label for every deal status", () => {
    for (const status of DEAL_STATUSES) {
      expect(DEAL_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it("has a non-empty Spanish label for every marketing tag", () => {
    for (const tag of MARKETING_TAGS) {
      expect(MARKETING_TAG_LABELS[tag]).toBeTruthy();
    }
  });

  it("matches the exact copy for the enum values used elsewhere", () => {
    expect(OPERATION_LABELS.sale).toBe("Venta");
    expect(OPERATION_LABELS.rent).toBe("Alquiler");
    expect(PUBLICATION_STATUS_LABELS.draft).toBe("Borrador");
    expect(PUBLICATION_STATUS_LABELS.published).toBe("Publicada");
    expect(PUBLICATION_STATUS_LABELS.archived).toBe("Archivada");
    expect(DEAL_STATUS_LABELS.available).toBe("Disponible");
    expect(DEAL_STATUS_LABELS.reserved).toBe("Reservada");
    expect(DEAL_STATUS_LABELS.sold).toBe("Vendida");
    expect(DEAL_STATUS_LABELS.rented).toBe("Alquilada");
    expect(MARKETING_TAG_LABELS.new).toBe("Nuevo");
    expect(MARKETING_TAG_LABELS.opportunity).toBe("Oportunidad");
    expect(MARKETING_TAG_LABELS.none).toBe("Sin etiqueta");
  });
});

describe("allowedDealStatuses", () => {
  it("restricts a sale to available, reserved, sold", () => {
    expect(allowedDealStatuses("sale")).toEqual([
      "available",
      "reserved",
      "sold",
    ]);
  });

  it("restricts a rent to available, reserved, rented", () => {
    expect(allowedDealStatuses("rent")).toEqual([
      "available",
      "reserved",
      "rented",
    ]);
  });

  it("never offers sold for a rent or rented for a sale", () => {
    expect(allowedDealStatuses("rent")).not.toContain("sold");
    expect(allowedDealStatuses("sale")).not.toContain("rented");
  });

  for (const currency of CURRENCIES) {
    it(`formats a ${currency} amount using es-AR grouping (smoke test)`, () => {
      expect(formatPrice(currency, 1000)).toContain("1.000");
    });
  }
});

describe("formatPrice", () => {
  it("prefixes USD amounts with US$", () => {
    expect(formatPrice("USD", 120_000)).toBe("US$ 120.000");
  });

  it("prefixes ARS amounts with a peso sign", () => {
    expect(formatPrice("ARS", 850_000)).toBe("$ 850.000");
  });

  it("rounds to whole units", () => {
    expect(formatPrice("USD", 1234.6)).toBe("US$ 1.235");
  });
});

describe("currencySymbol", () => {
  it("maps USD to US$ and ARS to $", () => {
    expect(currencySymbol("USD")).toBe("US$");
    expect(currencySymbol("ARS")).toBe("$");
  });
});
