import type { PropertyDetail } from "@/lib/api/properties";
import type { PublicPropertyDetail } from "@/lib/public/types";

/**
 * Maps an admin property to the public shape so the editor can render the
 * very same detail view the site shows (feature 16 T5). Mirrors what the
 * public API exposes: no admin-only fields, and the address only when the
 * property chose to show it.
 */
export function toPublicPropertyDetail(property: PropertyDetail): PublicPropertyDetail {
  return {
    id: property.id,
    code: property.code,
    slug: property.slug,
    operation: property.operation,
    type: property.type,
    title: property.title,
    description: property.description,
    neighborhood: {
      name: property.neighborhood.name,
      slug: property.neighborhood.slug,
    },
    address: property.showExactAddress ? property.address : null,
    currency: property.currency,
    price: property.price,
    expenses: property.expenses,
    rooms: property.rooms,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    hasGarage: property.hasGarage,
    coveredArea: property.coveredArea,
    totalArea: property.totalArea,
    age: property.age,
    creditEligible: property.creditEligible,
    petsAllowed: property.petsAllowed,
    immediateAvailability: property.immediateAvailability,
    marketingTag: property.marketingTag,
    featured: property.featured,
    dealStatus: property.dealStatus,
    services: {
      water: property.hasWater,
      naturalGas: property.hasNaturalGas,
      sewer: property.hasSewer,
      electricity: property.hasElectricity,
      internet: property.hasInternet,
    },
    publishedAt: property.firstPublishedAt,
    images: property.images.map((image) => ({
      url: image.url,
      width: image.width,
      height: image.height,
      thumbnailUrl: image.thumbnailUrl,
      thumbnailWidth: image.thumbnailWidth,
      thumbnailHeight: image.thumbnailHeight,
    })),
  };
}
