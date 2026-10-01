import type { Property, PropertyDetail } from "@/lib/api/properties";

/** A complete, valid `Property` for tests; override only what a test cares about. */
export function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: "p1",
    code: "SP-0001",
    slug: "casa-en-palermo",
    operation: "sale",
    type: "house",
    title: "Casa en Palermo",
    description: null,
    neighborhood: {
      id: "n1",
      name: "Palermo",
      slug: "palermo",
      createdAt: "2024-01-01",
    },
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
    publicationStatus: "draft",
    dealStatus: "available",
    firstPublishedAt: null,
    createdAt: "2024-01-15",
    updatedAt: "2024-02-01",
    ...overrides,
  };
}

export function makePropertyDetail(
  overrides: Partial<PropertyDetail> = {},
): PropertyDetail {
  return { ...makeProperty(), images: [], ...overrides };
}
