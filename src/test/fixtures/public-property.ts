import type { PublicPropertyDetail, PublicPropertyListItem } from "@/lib/public/types";

/** A complete published property as the public API returns it; override what a test needs. */
export function makePublicProperty(
  overrides: Partial<PublicPropertyListItem> = {},
): PublicPropertyListItem {
  return {
    id: "p1",
    code: "SP-0101",
    slug: "luminoso-3-ambientes-con-balcon",
    operation: "sale",
    type: "apartment",
    title: "Luminoso 3 ambientes con balcón al frente",
    description: "Departamento muy luminoso.\n\nCerca del subte.",
    neighborhood: { name: "Palermo", slug: "palermo" },
    address: "Gorriti 4800",
    currency: "USD",
    price: 185000,
    expenses: 145000,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    hasGarage: false,
    coveredArea: 72,
    totalArea: 78,
    age: 12,
    creditEligible: true,
    petsAllowed: true,
    immediateAvailability: false,
    marketingTag: "none",
    featured: true,
    dealStatus: "available",
    services: { water: true, naturalGas: true, sewer: true, electricity: true, internet: false },
    publishedAt: "2026-09-01T12:00:00.000Z",
    coverImage: "https://media.test/p1-thumb.webp",
    ...overrides,
  };
}

export function makePublicPropertyDetail(
  overrides: Partial<PublicPropertyDetail> = {},
): PublicPropertyDetail {
  const base: Partial<PublicPropertyListItem> = makePublicProperty();
  delete base.coverImage;
  return {
    ...(base as PublicPropertyDetail),
    images: [
      {
        url: "https://media.test/p1-1.webp",
        width: 1600,
        height: 1200,
        thumbnailUrl: "https://media.test/p1-1-thumb.webp",
        thumbnailWidth: 480,
        thumbnailHeight: 360,
      },
    ],
    ...overrides,
  };
}
