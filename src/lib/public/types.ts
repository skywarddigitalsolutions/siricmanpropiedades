import type {
  Currency,
  DealStatus,
  MarketingTag,
  Operation,
  PropertyType,
} from "@/lib/properties/enums";

/**
 * Public catalog shapes (`GET /api/properties*`). Narrower than the admin
 * `Property`: no publication status, and `address` is `null` unless the
 * owner chose to show the exact address.
 */
export type PublicProperty = {
  id: string;
  code: string;
  slug: string;
  operation: Operation;
  type: PropertyType;
  title: string;
  description: string | null;
  neighborhood: { name: string; slug: string };
  address: string | null;
  currency: Currency;
  price: number;
  expenses: number | null;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  hasGarage: boolean;
  coveredArea: number;
  totalArea: number;
  age: number;
  creditEligible: boolean;
  petsAllowed: boolean;
  immediateAvailability: boolean;
  marketingTag: MarketingTag;
  featured: boolean;
  dealStatus: DealStatus;
  services: {
    water: boolean;
    naturalGas: boolean;
    sewer: boolean;
    electricity: boolean;
    internet: boolean;
  };
  publishedAt: string | null;
};

/** Listing item: the cover is the thumbnail URL of the first photo, if any. */
export type PublicPropertyListItem = PublicProperty & { coverImage: string | null };

export type PublicPropertyImage = {
  url: string;
  width: number;
  height: number;
  thumbnailUrl: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
};

/** Detail: the full ordered gallery; the cover is `images[0]`. */
export type PublicPropertyDetail = PublicProperty & { images: PublicPropertyImage[] };

export type PublicNeighborhood = { id: string; name: string; slug: string };

export type PublicSort = "newest" | "price_asc" | "price_desc";

/** Query accepted by `GET /api/properties` (names as the back defines them). */
export type PublicPropertyFilters = {
  operation?: Operation;
  type?: PropertyType;
  neighborhood?: string;
  minRooms?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  hasGarage?: boolean;
  creditEligible?: boolean;
  petsAllowed?: boolean;
  featured?: boolean;
  code?: string;
  currency?: Currency;
  priceMin?: number;
  priceMax?: number;
  sort?: PublicSort;
  limit?: number;
  offset?: number;
};
