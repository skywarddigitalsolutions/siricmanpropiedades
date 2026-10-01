import type { Lead, LeadFilters } from "@/lib/api/leads";
import {
  LEAD_TOPIC_LABELS,
  LEAD_TYPE_LABELS,
  type LeadStatus,
  type LeadType,
} from "./labels";

/** Inbox URL state: `/admin/consultas?estado=…&tipo=…&pagina=…` (Spanish, shareable). */
export type InboxStatus = LeadStatus | "all";
export type InboxState = {
  status: InboxStatus;
  type?: LeadType;
  /** Free-text search over name, email, phone and message. */
  q?: string;
  /** Only leads about this property (UUID). */
  propertyId?: string;
  page: number;
};

export const INBOX_PATH = "/admin/consultas";

export const STATUS_SLUGS: Record<InboxStatus, string> = {
  new: "nuevas",
  contacted: "contactadas",
  closed: "cerradas",
  all: "todas",
};

export const TYPE_SLUGS: Record<LeadType, string> = {
  property_inquiry: "propiedad",
  appraisal: "tasacion",
  contact: "contacto",
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (raw: RawParams, key: string) => {
  const value = raw[key];
  return Array.isArray(value) ? value[0] : value;
};

function fromSlug<T extends string>(slugs: Record<T, string>, slug?: string): T | undefined {
  return (Object.keys(slugs) as T[]).find((key) => slugs[key] === slug);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseInboxParams(raw: RawParams): InboxState {
  const page = Number(first(raw, "pagina"));
  const type = fromSlug(TYPE_SLUGS, first(raw, "tipo"));
  const q = (first(raw, "q") ?? "").trim();
  const propertyId = first(raw, "propiedad");
  return {
    status: fromSlug(STATUS_SLUGS, first(raw, "estado")) ?? "new",
    ...(type ? { type } : {}),
    ...(q ? { q } : {}),
    // The API validates UUIDs and answers 400 otherwise: ignore a malformed one.
    ...(propertyId && UUID.test(propertyId) ? { propertyId } : {}),
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

export function toLeadFilters(state: InboxState, pageSize: number): LeadFilters {
  return {
    ...(state.status !== "all" ? { status: state.status } : {}),
    ...(state.type ? { type: state.type } : {}),
    ...(state.q ? { q: state.q } : {}),
    ...(state.propertyId ? { propertyId: state.propertyId } : {}),
    limit: pageSize,
    offset: (state.page - 1) * pageSize,
  };
}

/** Inbox URL with `patch` applied; filter changes go back to page 1. */
export function buildInboxHref(state: InboxState, patch: Partial<InboxState> = {}): string {
  const next = { ...state, page: 1, ...patch };
  const params = new URLSearchParams();
  if (next.status !== "new") params.set("estado", STATUS_SLUGS[next.status]);
  if (next.type) params.set("tipo", TYPE_SLUGS[next.type]);
  if (next.q) params.set("q", next.q);
  if (next.propertyId) params.set("propiedad", next.propertyId);
  if (next.page > 1) params.set("pagina", String(next.page));
  const query = params.toString();
  return query ? `${INBOX_PATH}?${query}` : INBOX_PATH;
}

const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "30/09 12:05" in Buenos Aires time (built from parts: locale data varies). */
export function formatLeadDate(iso: string): string {
  const parts = Object.fromEntries(
    DATE_FORMAT.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  const pad = (value: string) => value.padStart(2, "0");
  return `${pad(parts.day)}/${pad(parts.month)} ${pad(parts.hour)}:${pad(parts.minute)}`;
}

/** One line about what the lead refers to (property, topic or type). */
export function leadSummary(lead: Pick<Lead, "type" | "property" | "topic">): string {
  if (lead.property) return `${lead.property.code} · ${lead.property.title}`;
  if (lead.type === "property_inquiry") return `${LEAD_TYPE_LABELS.property_inquiry} (ya no publicada)`;
  if (lead.topic) return `${LEAD_TYPE_LABELS[lead.type]} · ${LEAD_TOPIC_LABELS[lead.topic]}`;
  return LEAD_TYPE_LABELS[lead.type];
}
