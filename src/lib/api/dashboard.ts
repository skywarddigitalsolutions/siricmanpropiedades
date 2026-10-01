import "server-only";
import { apiFetch } from "./client";
import type { LeadStatus, LeadType } from "@/lib/leads/labels";

/** `GET /api/admin/dashboard` (admin + manager): the numbers behind the panel home. */
export type DashboardSummary = {
  leads: { new: number; total: number };
  properties: {
    draft: number;
    published: number;
    archived: number;
    publishedWithoutImages: number;
  };
  /** Newest first, at most 5. */
  latestLeads: {
    id: string;
    name: string;
    type: LeadType;
    status: LeadStatus;
    createdAt: string;
    property: { id: string; code: string; title: string } | null;
  }[];
};

export function getDashboard(token: string): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/admin/dashboard", { token });
}
