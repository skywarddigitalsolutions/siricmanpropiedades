import { buildWhatsAppLink } from "@/lib/whatsapp";

/** Lead enums as the API defines them (client-safe). */
export const LEAD_TYPES = ["property_inquiry", "appraisal", "contact"] as const;
export const LEAD_STATUSES = ["new", "contacted", "closed"] as const;
export const LEAD_TOPICS = ["buy", "rent", "sell", "consortium", "other"] as const;

export type LeadType = (typeof LEAD_TYPES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadTopic = (typeof LEAD_TOPICS)[number];

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  property_inquiry: "Consulta por propiedad",
  appraisal: "Pedido de tasación",
  contact: "Contacto",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nueva",
  contacted: "Contactada",
  closed: "Cerrada",
};

export const LEAD_TOPIC_LABELS: Record<LeadTopic, string> = {
  buy: "Quiere comprar",
  rent: "Quiere alquilar",
  sell: "Quiere vender o tasar",
  consortium: "Administración de consorcios",
  other: "Otro",
};

/**
 * WhatsApp link to a visitor's phone. Numbers already starting with the
 * country code (54) are kept; local ones ("11 3896-7363", "011 …") are taken
 * as Argentine mobiles (54 9 …), which is how most visitors write them.
 */
export function whatsappToLead(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("54") ? digits : `549${digits.replace(/^0/, "")}`;
  return buildWhatsAppLink(international, message);
}
