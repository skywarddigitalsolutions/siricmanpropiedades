/**
 * Property enum values mirrored from the back's Postgres enum types
 * (`back-siricmanpropiedades/src/properties/enums/property.enums.ts`).
 * Plain module (no `server-only`): shared by server wrappers
 * (`src/lib/api/properties.ts`) and client components (form selects, filter
 * pills) alike.
 */

export const OPERATIONS = ["sale", "rent"] as const;
export type Operation = (typeof OPERATIONS)[number];

export const PROPERTY_TYPES = [
  "apartment",
  "house",
  "ph",
  "land",
  "commercial",
  "office",
  "garage",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const CURRENCIES = ["USD", "ARS"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const PUBLICATION_STATUSES = ["draft", "published", "archived"] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const DEAL_STATUSES = ["available", "reserved", "sold", "rented"] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

export const MARKETING_TAGS = ["new", "opportunity", "none"] as const;
export type MarketingTag = (typeof MARKETING_TAGS)[number];
