/**
 * Pure display rules for public property cards and pages (copy follows the
 * site design). Icons are semantic names; components map them to lucide.
 */
import {
  DEAL_STATUS_LABELS,
  MARKETING_TAG_LABELS,
  PROPERTY_TYPE_LABELS,
  formatPrice,
} from "@/lib/properties/labels";
import { absoluteUrl } from "@/lib/site-url";
import { WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import type { MapPrecision } from "@/lib/maps";
import { AMENITY_KEYS, type AmenityKey, type PublicProperty } from "./types";

export type SpecIcon = "area" | "rooms" | "bedrooms" | "bathrooms" | "garage";

/** Type rules shared by the spec row and the full characteristics list. */
const showsRooms = (property: PublicProperty) =>
  Boolean(property.rooms) && property.type !== "commercial";
const showsGarage = (property: PublicProperty) =>
  property.hasGarage && property.type !== "garage";

const amount = (value: number) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(value);

export function propertyPriceLabel(property: PublicProperty): string {
  const price = formatPrice(property.currency, property.price);
  return property.operation === "rent" ? `${price} /mes` : price;
}

export function expensesLabel(property: PublicProperty): string | null {
  return property.expenses ? `+ $ ${amount(property.expenses)} expensas` : null;
}

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

/** Compact specs for cards: icon + short text, with a full label for screen readers. */
export function propertySpecs(
  property: PublicProperty,
): { icon: SpecIcon; text: string; label: string }[] {
  const specs: { icon: SpecIcon; text: string; label: string }[] = [];
  if (property.totalArea) {
    const area = `${amount(property.totalArea)} m²`;
    specs.push({ icon: "area", text: area, label: `${area} totales` });
  }
  if (showsRooms(property)) {
    specs.push({
      icon: "rooms",
      text: `${property.rooms} amb.`,
      label: plural(property.rooms, "ambiente", "ambientes"),
    });
  }
  if (property.bedrooms) {
    specs.push({
      icon: "bedrooms",
      text: String(property.bedrooms),
      label: plural(property.bedrooms, "dormitorio", "dormitorios"),
    });
  }
  if (property.bathrooms) {
    specs.push({
      icon: "bathrooms",
      text: String(property.bathrooms),
      label: plural(property.bathrooms, "baño", "baños"),
    });
  }
  if (showsGarage(property)) {
    specs.push({ icon: "garage", text: "1", label: "Con cochera" });
  }
  return specs;
}

export function tagLabel(property: PublicProperty): string | null {
  return property.marketingTag === "none" ? null : MARKETING_TAG_LABELS[property.marketingTag];
}

/** `null` while available; reserved still accepts inquiries, sold/rented do not. */
export function dealStatusNotice(
  property: PublicProperty,
): { label: string; tone: "reserved" | "closed"; available: boolean } | null {
  if (property.dealStatus === "available") return null;
  const reserved = property.dealStatus === "reserved";
  return {
    label: DEAL_STATUS_LABELS[property.dealStatus],
    tone: reserved ? "reserved" : "closed",
    available: reserved,
  };
}

export function propertyLocation(property: PublicProperty): { label: string; exact: boolean } {
  const area = `${property.neighborhood.name}, CABA`;
  // Trimmed like propertyMap, so a blank address never counts as exact.
  const address = property.address?.trim();
  return address
    ? { label: `${address} · ${area}`, exact: true }
    : { label: area, exact: false };
}

export function propertyMap(property: PublicProperty): {
  query: string;
  precision: MapPrecision;
} {
  const barrio = property.neighborhood.name;
  const address = property.address?.trim();
  return address
    ? { query: `${address}, ${barrio}, CABA`, precision: "exact" }
    : { query: `${barrio}, CABA`, precision: "approximate" };
}

/**
 * Full characteristics list, "label → value": only facts with data, following
 * the same type rules as the spec row. Expenses are left out (they sit under
 * the price).
 */
export function propertyFacts(property: PublicProperty): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = [
    { label: "Tipo", value: PROPERTY_TYPE_LABELS[property.type] },
  ];
  if (property.totalArea) {
    facts.push({ label: "Superficie total", value: `${amount(property.totalArea)} m²` });
  }
  if (property.coveredArea) {
    facts.push({ label: "Superficie cubierta", value: `${amount(property.coveredArea)} m²` });
  }
  if (showsRooms(property)) {
    facts.push({ label: "Ambientes", value: String(property.rooms) });
  }
  if (property.bedrooms) facts.push({ label: "Dormitorios", value: String(property.bedrooms) });
  if (property.bathrooms) facts.push({ label: "Baños", value: String(property.bathrooms) });
  if (showsGarage(property)) {
    facts.push({ label: "Cochera", value: "Sí" });
  }
  if (property.type !== "land") {
    facts.push({
      label: "Antigüedad",
      value: property.age === 0 ? "A estrenar" : plural(property.age, "año", "años"),
    });
  }
  return facts;
}

export function conditionLabels(property: PublicProperty): string[] {
  return [
    property.creditEligible && "Apto crédito",
    property.petsAllowed && "Acepta mascotas",
    property.immediateAvailability && "Disponibilidad inmediata",
  ].filter((label): label is string => Boolean(label));
}

export type ServiceKey = keyof PublicProperty["services"];

const SERVICE_LABELS: [ServiceKey, string][] = [
  ["water", "Agua corriente"],
  ["naturalGas", "Gas natural"],
  ["sewer", "Cloacas"],
  ["electricity", "Electricidad"],
  ["internet", "Internet"],
];

/** Utilities the property has, in a fixed order. */
export function serviceItems(property: PublicProperty): { key: ServiceKey; label: string }[] {
  return SERVICE_LABELS.filter(([key]) => property.services[key]).map(([key, label]) => ({
    key,
    label,
  }));
}

const AMENITY_LABELS: Record<AmenityKey, string> = {
  pool: "Pileta",
  gym: "Gimnasio",
  grill: "Parrilla / quincho",
  multipurposeRoom: "SUM",
  security: "Seguridad 24 h",
  elevator: "Ascensor",
  balcony: "Balcón",
  terrace: "Terraza",
  garden: "Jardín",
  patio: "Patio",
  laundry: "Lavadero",
  storage: "Baulera",
};

/** Amenities the property has, in a fixed order; empty while the API sends none. */
export function amenityItems(property: PublicProperty): { key: AmenityKey; label: string }[] {
  return AMENITY_KEYS.filter((key) => property.amenities?.[key]).map((key) => ({
    key,
    label: AMENITY_LABELS[key],
  }));
}

/** Prefilled inquiry-form message; the form already tells the agency which property it is. */
export function inquiryMessage(property: Pick<PublicProperty, "title">): string {
  return `Hola, me interesa "${displayTitle(property.title)}". ¿Podemos coordinar una visita?`;
}

/**
 * WhatsApp message: the page link instead of the property code, so the agency
 * knows which listing it is (WhatsApp shows it as a card with the photo) and
 * the visitor never sees an internal code.
 */
export function whatsappInquiry(property: Pick<PublicProperty, "slug" | "title">) {
  const message = `${inquiryMessage(property)} ${absoluteUrl(`/propiedades/${property.slug}`)}`;
  return { message, href: buildWhatsAppLink(WHATSAPP_PHONE, message) };
}

const ACRONYMS = new Set(["PH", "CABA", "USD", "US", "ARS", "EEUU"]);
const CONNECTORS = new Set([
  "a", "al", "con", "de", "del", "e", "el", "en", "la", "las", "lo", "los",
  "o", "para", "por", "sin", "sobre", "u", "un", "una", "y",
]);

/**
 * Display form of a stored title. Titles typed in ALL CAPS become title case
 * (connectors lowercase, known acronyms like PH/CABA/USD kept); anything with
 * lowercase letters, or no letters at all, is returned as typed.
 */
export function displayTitle(title: string): string {
  if (title !== title.toUpperCase() || title === title.toLowerCase()) return title;

  let first = true;
  return title.replace(/\p{L}[\p{L}'’]*/gu, (word, offset: number) => {
    const isFirst = first;
    first = false;
    const afterDigit = /\d/.test(title[offset - 1] ?? "");
    if (ACRONYMS.has(word) && !afterDigit) return word;
    const lower = word.toLowerCase();
    if (afterDigit || (!isFirst && CONNECTORS.has(lower))) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
}

/** Google Maps search URL for an address or barrio (opens in the Maps app on phones). */
export function propertyMapsHref(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
