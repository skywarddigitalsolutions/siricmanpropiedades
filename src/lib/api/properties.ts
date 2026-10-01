import "server-only";
import { apiFetch } from "./client";
import { buildQuery } from "./query-string";
import type {
  Currency,
  DealStatus,
  MarketingTag,
  Operation,
  PropertyType,
  PublicationStatus,
} from "../properties/enums";

/**
 * Embedded relation on `Property` (and the shape of `GET /api/neighborhoods`
 * — see `back-siricmanpropiedades/src/neighborhoods/entities/neighborhood.entity.ts`).
 * TypeORM loads the full `Neighborhood` row for the relation (no `select`
 * restriction), so it also carries `createdAt`.
 */
export type Neighborhood = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

/**
 * `GET/POST/PATCH /api/admin/properties[...]` response shape. `price`,
 * `expenses`, `coveredArea`, and `totalArea` map to Postgres `numeric`
 * columns, but `Property`'s `numericTransformer`
 * (`back-siricmanpropiedades/src/common/transformers/numeric.transformer.ts`)
 * already parses them to a JS `number` before the entity is serialized to
 * JSON, and the back has no `ClassSerializerInterceptor` that would change
 * that — so these arrive as numbers, not numeric strings.
 */
export type Property = {
  id: string;
  code: string;
  slug: string;
  operation: Operation;
  type: PropertyType;
  title: string;
  description: string | null;
  neighborhood: Neighborhood;
  address: string;
  showExactAddress: boolean;
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
  hasWater: boolean;
  hasNaturalGas: boolean;
  hasSewer: boolean;
  hasElectricity: boolean;
  hasInternet: boolean;
  publicationStatus: PublicationStatus;
  dealStatus: DealStatus;
  firstPublishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Admin-facing image shape — see `PropertyImageResponse` on the back. */
export type PropertyImage = {
  id: string;
  position: number;
  url: string;
  width: number;
  height: number;
  thumbnailUrl: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  createdAt: string;
};

/** `GET /api/admin/properties/:id` — detail adds the ordered image list. */
export type PropertyDetail = Property & { images: PropertyImage[] };

/** Body for `POST /api/admin/properties` (and, partial, for `PATCH`). */
export type CreatePropertyInput = {
  operation: Operation;
  type: PropertyType;
  title: string;
  description?: string;
  neighborhoodId: string;
  address: string;
  showExactAddress?: boolean;
  currency: Currency;
  price: number;
  expenses?: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  hasGarage?: boolean;
  coveredArea: number;
  totalArea: number;
  age: number;
  creditEligible?: boolean;
  petsAllowed?: boolean;
  immediateAvailability?: boolean;
  marketingTag?: MarketingTag;
  featured?: boolean;
  hasWater?: boolean;
  hasNaturalGas?: boolean;
  hasSewer?: boolean;
  hasElectricity?: boolean;
  hasInternet?: boolean;
};

/**
 * Body for `PATCH /api/admin/properties/:id`. Same as a partial
 * `CreatePropertyInput`, except `description`/`expenses` additionally accept
 * an explicit `null` to clear them — the back's `update()` only skips a key
 * that is `undefined`, so omitting the key leaves the stored value
 * untouched, while `null` passes `class-validator`'s `@IsOptional()` and is
 * assigned as-is (verified against `properties.service.ts`'s `update()`,
 * feature 6 T4).
 */
export type UpdatePropertyInput = Omit<
  Partial<CreatePropertyInput>,
  "description" | "expenses"
> & {
  description?: string | null;
  expenses?: number | null;
};

/** Query filters for `GET /api/admin/properties`. */
export type PropertyFilters = {
  publicationStatus?: PublicationStatus;
  dealStatus?: DealStatus;
  operation?: Operation;
  type?: PropertyType;
  neighborhoodId?: string;
  q?: string;
  limit?: number;
  offset?: number;
};

export type Paginated<T> = { items: T[]; total: number };

/** `GET /api/admin/properties` — every publicationStatus, filterable, paginated. */
export function listProperties(
  token: string,
  filters: PropertyFilters = {},
): Promise<Paginated<Property>> {
  return apiFetch<Paginated<Property>>(
    `/admin/properties${buildQuery(filters)}` as `/${string}`,
    { token },
  );
}

/** `GET /api/admin/properties/:id` — detail including images. */
export function getProperty(
  token: string,
  id: string,
): Promise<PropertyDetail> {
  return apiFetch<PropertyDetail>(`/admin/properties/${id}`, { token });
}

/** `POST /api/admin/properties` — creates a draft. */
export function createProperty(
  token: string,
  input: CreatePropertyInput,
): Promise<Property> {
  return apiFetch<Property>("/admin/properties", {
    method: "POST",
    body: input,
    token,
  });
}

/** `PATCH /api/admin/properties/:id` — updates editable fields. */
export function updateProperty(
  token: string,
  id: string,
  input: UpdatePropertyInput,
): Promise<Property> {
  return apiFetch<Property>(`/admin/properties/${id}`, {
    method: "PATCH",
    body: input,
    token,
  });
}

/** `PATCH /api/admin/properties/:id/publish` — draft|archived -> published. */
export function publishProperty(
  token: string,
  id: string,
): Promise<Property> {
  return apiFetch<Property>(`/admin/properties/${id}/publish`, {
    method: "PATCH",
    token,
  });
}

/** `PATCH /api/admin/properties/:id/archive` — draft|published -> archived. */
export function archiveProperty(
  token: string,
  id: string,
): Promise<Property> {
  return apiFetch<Property>(`/admin/properties/${id}/archive`, {
    method: "PATCH",
    token,
  });
}

/** `PATCH /api/admin/properties/:id/unpublish` — published|archived -> draft. */
export function unpublishProperty(
  token: string,
  id: string,
): Promise<Property> {
  return apiFetch<Property>(`/admin/properties/${id}/unpublish`, {
    method: "PATCH",
    token,
  });
}

/** `PATCH /api/admin/properties/:id/deal-status` — independent of publicationStatus. */
export function updateDealStatus(
  token: string,
  id: string,
  dealStatus: DealStatus,
): Promise<Property> {
  return apiFetch<Property>(`/admin/properties/${id}/deal-status`, {
    method: "PATCH",
    body: { dealStatus },
    token,
  });
}

/** `DELETE /api/admin/properties/:id` — admin only, never-published only. */
export function deleteProperty(token: string, id: string): Promise<void> {
  return apiFetch<void>(`/admin/properties/${id}`, {
    method: "DELETE",
    token,
  });
}

/**
 * `POST /api/admin/properties/:id/images` — multipart with a single `file`
 * field and no other fields (the back rejects extra parts, see
 * `IMAGE_UPLOAD_LIMITS` on `AdminPropertyImagesController`).
 */
export function uploadPropertyImage(
  token: string,
  id: string,
  file: File | Blob,
): Promise<PropertyImage> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<PropertyImage>(`/admin/properties/${id}/images`, {
    method: "POST",
    body: formData,
    token,
  });
}

/** `PUT /api/admin/properties/:id/images/order` — exact permutation of ids. */
export function reorderPropertyImages(
  token: string,
  id: string,
  imageIds: string[],
): Promise<PropertyImage[]> {
  return apiFetch<PropertyImage[]>(`/admin/properties/${id}/images/order`, {
    method: "PUT",
    body: { imageIds },
    token,
  });
}

/** `DELETE /api/admin/properties/:id/images/:imageId`. */
export function deletePropertyImage(
  token: string,
  id: string,
  imageId: string,
): Promise<void> {
  return apiFetch<void>(`/admin/properties/${id}/images/${imageId}`, {
    method: "DELETE",
    token,
  });
}

/** `GET /api/neighborhoods` — public, ordered by name. */
export function listNeighborhoods(): Promise<Neighborhood[]> {
  return apiFetch<Neighborhood[]>("/neighborhoods");
}
