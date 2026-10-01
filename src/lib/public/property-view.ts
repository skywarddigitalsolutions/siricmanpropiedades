import { DEAL_STATUS_LABELS, MARKETING_TAG_LABELS, formatPrice } from "@/lib/properties/labels";
import { WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import type { MapPrecision } from "@/lib/maps";
import type { PublicProperty } from "./types";

/**
 * Pure display rules for public property cards and pages (copy follows the
 * site design). Icons are semantic names; components map them to lucide.
 */
export type SpecIcon = "area" | "rooms" | "bedrooms" | "bathrooms" | "garage";
export type FactIcon = SpecIcon | "coveredArea" | "age" | "expenses";

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
  if (property.rooms && property.type !== "commercial") {
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
  if (property.hasGarage && property.type !== "garage") {
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
  return property.address
    ? { label: `${property.address} · ${area}`, exact: true }
    : { label: `${area} · zona aproximada`, exact: false };
}

export function propertyMap(property: PublicProperty): {
  query: string;
  precision: MapPrecision;
  label: string;
} {
  const barrio = property.neighborhood.name;
  const address = property.address?.trim();
  return address
    ? { query: `${address}, ${barrio}, CABA`, precision: "exact", label: `${address}, ${barrio}` }
    : { query: `${barrio}, CABA`, precision: "approximate", label: `Zona aproximada · ${barrio}` };
}

export function propertyFacts(
  property: PublicProperty,
): { icon: FactIcon; label: string; value: string }[] {
  const orDash = (value: number, text = String(value)) => (value ? text : "—");
  return [
    { icon: "area", label: "Sup. total", value: orDash(property.totalArea, `${amount(property.totalArea)} m²`) },
    { icon: "coveredArea", label: "Sup. cubierta", value: orDash(property.coveredArea, `${amount(property.coveredArea)} m²`) },
    { icon: "rooms", label: "Ambientes", value: orDash(property.rooms) },
    { icon: "bedrooms", label: "Dormitorios", value: orDash(property.bedrooms) },
    { icon: "bathrooms", label: "Baños", value: orDash(property.bathrooms) },
    { icon: "garage", label: "Cochera", value: property.hasGarage ? "Sí" : "No" },
    {
      icon: "age",
      label: "Antigüedad",
      value: property.age === 0 ? "A estrenar" : plural(property.age, "año", "años"),
    },
    {
      icon: "expenses",
      label: "Expensas",
      value: property.expenses ? `$ ${amount(property.expenses)}` : "No tiene",
    },
  ];
}

export function conditionLabels(property: PublicProperty): string[] {
  return [
    property.creditEligible && "Apto crédito",
    property.petsAllowed && "Acepta mascotas",
    property.immediateAvailability && "Disponibilidad inmediata",
  ].filter((label): label is string => Boolean(label));
}

const SERVICE_LABELS: [keyof PublicProperty["services"], string][] = [
  ["water", "Agua corriente"],
  ["naturalGas", "Gas natural"],
  ["sewer", "Cloacas"],
  ["electricity", "Electricidad"],
  ["internet", "Internet"],
];

export function serviceLabels(property: PublicProperty): string[] {
  return SERVICE_LABELS.filter(([key]) => property.services[key]).map(([, label]) => label);
}

export function whatsappInquiry(property: Pick<PublicProperty, "code" | "title">) {
  const message = `Hola, me interesa la propiedad ${property.code} (${property.title}). ¿Podemos coordinar una visita?`;
  return { message, href: buildWhatsAppLink(WHATSAPP_PHONE, message) };
}
