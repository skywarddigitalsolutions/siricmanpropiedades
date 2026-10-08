import type { LeadTopic, LeadType } from "./labels";

/**
 * Lead categories (client-safe). Derived from type + topic with the same rule
 * the API uses for `?category=` and `leads.newByCategory`:
 * - appraisal: type appraisal.
 * - search: property inquiries and contacts about buying or renting.
 * - management: contacts about rental or consortium management.
 * - other: anything else (sell, other, no topic).
 */
export const LEAD_CATEGORIES = ["appraisal", "search", "management", "other"] as const;
export type LeadCategory = (typeof LEAD_CATEGORIES)[number];

export const LEAD_CATEGORY_LABELS: Record<LeadCategory, string> = {
  appraisal: "Tasaciones",
  search: "Compra y alquiler",
  management: "Administración",
  other: "Otras",
};

export function leadCategory(lead: { type: LeadType; topic?: LeadTopic | null }): LeadCategory {
  if (lead.type === "appraisal") return "appraisal";
  if (lead.type === "property_inquiry") return "search";
  if (lead.topic === "buy" || lead.topic === "rent") return "search";
  if (lead.topic === "rental_management" || lead.topic === "consortium") return "management";
  return "other";
}
