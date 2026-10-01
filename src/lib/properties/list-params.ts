/**
 * Pure parsing/href-building for `/admin/propiedades` (feature 6 T3). Plain
 * module (no `server-only`): the page (Server Component) parses the resolved
 * `searchParams` object with this, and presentational components (filters,
 * pagination) build hrefs with it — none of them touch `fetch` or cookies.
 */
import {
  DEAL_STATUSES,
  OPERATIONS,
  PROPERTY_TYPES,
  PUBLICATION_STATUSES,
} from "./enums";
import type {
  DealStatus,
  Operation,
  PropertyType,
  PublicationStatus,
} from "./enums";

/** Fixed page size for the admin property list (not user-configurable). */
export const PAGE_SIZE = 20;

/** The `q` filter is capped at 100 characters, matching the back's limit. */
const MAX_QUERY_LENGTH = 100;

export type PropertyListFilters = {
  q?: string;
  publicationStatus?: PublicationStatus;
  dealStatus?: DealStatus;
  operation?: Operation;
  type?: PropertyType;
  neighborhoodId?: string;
};

export type ParsedPropertyListParams = {
  filters: PropertyListFilters;
  page: number;
  limit: number;
  offset: number;
};

/** Shape Next 16 resolves `searchParams` to (a plain object, repeatable keys as arrays). */
export type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseEnumValue<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  return value !== undefined && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

/**
 * Parses the resolved `searchParams` into validated filters plus pagination.
 * Unknown enum values are dropped rather than forwarded to the back (which
 * would 400 on them); `page` is clamped to at least 1.
 */
export function parsePropertyListParams(
  raw: RawSearchParams,
): ParsedPropertyListParams {
  const qRaw = firstValue(raw.q)?.trim();
  const q = qRaw ? qRaw.slice(0, MAX_QUERY_LENGTH) : undefined;

  const neighborhoodIdRaw = firstValue(raw.neighborhoodId)?.trim();
  const neighborhoodId = neighborhoodIdRaw ? neighborhoodIdRaw : undefined;

  const filters: PropertyListFilters = {};
  if (q) filters.q = q;
  const publicationStatus = parseEnumValue(
    firstValue(raw.publicationStatus),
    PUBLICATION_STATUSES,
  );
  if (publicationStatus) filters.publicationStatus = publicationStatus;
  const dealStatus = parseEnumValue(firstValue(raw.dealStatus), DEAL_STATUSES);
  if (dealStatus) filters.dealStatus = dealStatus;
  const operation = parseEnumValue(firstValue(raw.operation), OPERATIONS);
  if (operation) filters.operation = operation;
  const type = parseEnumValue(firstValue(raw.type), PROPERTY_TYPES);
  if (type) filters.type = type;
  if (neighborhoodId) filters.neighborhoodId = neighborhoodId;

  const pageRaw = Number.parseInt(firstValue(raw.page) ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 1 ? pageRaw : 1;

  return { filters, page, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
}

/**
 * Number of *secondary* filters currently active (everything but `q`, which
 * is always visible on its own) — drives the `<details>` summary's count and
 * whether it starts open.
 */
export function countSecondaryFilters(filters: PropertyListFilters): number {
  return [
    filters.publicationStatus,
    filters.dealStatus,
    filters.operation,
    filters.type,
    filters.neighborhoodId,
  ].filter(Boolean).length;
}

/** True when any filter, including `q`, is active. */
export function hasActiveFilters(filters: PropertyListFilters): boolean {
  return Object.keys(filters).length > 0;
}

/** Builds an `/admin/propiedades` href preserving every filter, for a given page. */
export function buildPropertyListHref(
  filters: PropertyListFilters,
  page: number,
): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.publicationStatus) {
    params.set("publicationStatus", filters.publicationStatus);
  }
  if (filters.dealStatus) params.set("dealStatus", filters.dealStatus);
  if (filters.operation) params.set("operation", filters.operation);
  if (filters.type) params.set("type", filters.type);
  if (filters.neighborhoodId) {
    params.set("neighborhoodId", filters.neighborhoodId);
  }
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/admin/propiedades?${query}` : "/admin/propiedades";
}
