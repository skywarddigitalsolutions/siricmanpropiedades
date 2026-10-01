import "server-only";
import { apiFetch, apiFetchRaw } from "./client";
import type { Paginated } from "./properties";
import { buildQuery } from "./query-string";

/** One person who left an email (`GET /api/admin/clients`, derived from leads). */
export type Client = {
  /** Lowercased; the identity of the client. */
  email: string;
  /** Name from the latest inquiry. */
  name: string;
  /** Latest non-null phone. */
  phone: string | null;
  inquiries: number;
  firstInquiryAt: string;
  lastInquiryAt: string;
  /** Distinct properties asked about, latest first (max 5). */
  properties: { id: string; code: string; title: string }[];
};

export type ClientFilters = { q?: string; limit?: number; offset?: number };

export function listClients(token: string, filters: ClientFilters = {}): Promise<Paginated<Client>> {
  return apiFetch<Paginated<Client>>(`/admin/clients${buildQuery(filters)}` as `/${string}`, {
    token,
  });
}

/** The back's CSV (personal data, audited there) as a raw response to stream through the BFF. */
export function exportClientsCsv(token: string, filters: { q?: string } = {}): Promise<Response> {
  return apiFetchRaw(`/admin/clients/export.csv${buildQuery(filters)}` as `/${string}`, {
    token,
  });
}
