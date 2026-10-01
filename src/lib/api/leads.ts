import "server-only";
import { apiFetch } from "./client";
import type { Paginated } from "./properties";
import { buildQuery } from "./query-string";
import type { LeadStatus, LeadTopic, LeadType } from "@/lib/leads/labels";

/** Body of `POST /api/leads` (public; the API also requires phone or email). */
export type LeadSubmission = {
  type: LeadType;
  propertyId?: string;
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  topic?: LeadTopic;
  details?: { propertyType?: string; address?: string; rooms?: number; area?: number };
  website?: string;
};

export type Lead = {
  id: string;
  type: LeadType;
  status: LeadStatus;
  name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  topic: LeadTopic | null;
  details: LeadSubmission["details"] | null;
  notes: string | null;
  property: { id: string; code: string; title: string; slug: string } | null;
  createdAt: string;
  updatedAt: string;
};

/** Per-status totals of the current search (they ignore the `status` filter). */
export type LeadCounts = Record<LeadStatus, number>;

export type LeadsPage = Paginated<Lead> & { counts?: LeadCounts };

export type LeadFilters = {
  status?: LeadStatus;
  type?: LeadType;
  /** Search over name, email, phone and message. */
  q?: string;
  propertyId?: string;
  limit?: number;
  offset?: number;
};

/** Public submission, sent from a Server Action (the visitor's IP is forwarded for throttling). */
export function submitLead(input: LeadSubmission): Promise<{ received: true }> {
  return apiFetch("/leads", { method: "POST", body: input });
}

export function listLeads(token: string, filters: LeadFilters = {}): Promise<LeadsPage> {
  return apiFetch<LeadsPage>(`/admin/leads${buildQuery(filters)}` as `/${string}`, {
    token,
  });
}

export function getLead(token: string, id: string): Promise<Lead> {
  return apiFetch<Lead>(`/admin/leads/${id}`, { token });
}

export function updateLead(
  token: string,
  id: string,
  changes: { status?: LeadStatus; notes?: string },
): Promise<Lead> {
  return apiFetch<Lead>(`/admin/leads/${id}`, { method: "PATCH", body: changes, token });
}

export function deleteLead(token: string, id: string): Promise<void> {
  return apiFetch<void>(`/admin/leads/${id}`, { method: "DELETE", token });
}
