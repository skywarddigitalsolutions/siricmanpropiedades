import "server-only";
import type { Paginated } from "./properties";
import { apiFetch } from "./client";
import { buildQuery } from "./query-string";
import type {
  PublicNeighborhood,
  PublicPropertyDetail,
  PublicPropertyFilters,
  PublicPropertyListItem,
} from "@/lib/public/types";

/**
 * Public catalog reads for the site. Responses go through Next's data cache
 * (shared by all visitors) so pages render per request without hitting the
 * API every time; see the feature 7 throttling decision.
 */
export const CATALOG_REVALIDATE_SECONDS = 60;
export const NEIGHBORHOODS_REVALIDATE_SECONDS = 3600;

export function listPublicProperties(
  filters: PublicPropertyFilters,
): Promise<Paginated<PublicPropertyListItem>> {
  return apiFetch<Paginated<PublicPropertyListItem>>(
    `/properties${buildQuery(filters)}` as `/${string}`,
    { revalidate: CATALOG_REVALIDATE_SECONDS },
  );
}

/** Throws `ApiError(404)` when the slug does not exist or is not published. */
export function getPublicProperty(slug: string): Promise<PublicPropertyDetail> {
  return apiFetch<PublicPropertyDetail>(`/properties/${encodeURIComponent(slug)}`, {
    revalidate: CATALOG_REVALIDATE_SECONDS,
  });
}

export function getPublicNeighborhoods(): Promise<PublicNeighborhood[]> {
  return apiFetch<PublicNeighborhood[]>("/neighborhoods", {
    revalidate: NEIGHBORHOODS_REVALIDATE_SECONDS,
  });
}
