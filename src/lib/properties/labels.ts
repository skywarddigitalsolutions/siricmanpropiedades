/**
 * Spanish UI copy for the property enums, plus small display helpers. Plain
 * module (no `server-only`): used from both server components/actions and
 * client components (selects, badges, filter pills).
 */
import type {
  Currency,
  DealStatus,
  MarketingTag,
  Operation,
  PropertyType,
  PublicationStatus,
} from "./enums";

export const OPERATION_LABELS: Record<Operation, string> = {
  sale: "Venta",
  rent: "Alquiler",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Departamento",
  house: "Casa",
  ph: "PH",
  land: "Terreno",
  commercial: "Local",
  office: "Oficina",
  garage: "Cochera",
};

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  draft: "Borrador",
  published: "Publicada",
  archived: "Archivada",
};

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  available: "Disponible",
  reserved: "Reservada",
  sold: "Vendida",
  rented: "Alquilada",
};

export const MARKETING_TAG_LABELS: Record<MarketingTag, string> = {
  new: "Nuevo",
  opportunity: "Oportunidad",
  none: "Sin etiqueta",
};

/**
 * Product decision (ROADMAP, feature 6): a sale can only ever be marked
 * available/reserved/sold; a rent can only ever be available/reserved/rented.
 * The back does not enforce this yet, so the panel UI is the only guard.
 */
export function allowedDealStatuses(operation: Operation): DealStatus[] {
  return operation === "sale"
    ? ["available", "reserved", "sold"]
    : ["available", "reserved", "rented"];
}

/**
 * Formats a price for display: `"US$ 120.000"` or `"$ 850.000"`, es-AR
 * grouping, no decimals (properties are always listed in whole currency
 * units).
 */
export function formatPrice(currency: Currency, amount: number): string {
  const formatted = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${currencySymbol(currency)} ${formatted}`;
}

/** Symbol shown next to amounts and inside price inputs: `US$` or `$`. */
export function currencySymbol(currency: Currency): string {
  return currency === "USD" ? "US$" : "$";
}
