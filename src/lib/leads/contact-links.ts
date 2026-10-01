import type { Lead } from "@/lib/api/leads";
import { whatsappToLead } from "./labels";

type ContactLead = Pick<Lead, "name" | "phone" | "email" | "property">;

/**
 * One-tap ways to answer a lead from the panel: call, WhatsApp (with a
 * greeting by first name) and email (with a subject). Missing data → no link.
 */
export function leadContactLinks(lead: ContactLead): {
  call?: string;
  whatsapp?: string;
  email?: string;
} {
  const firstName = lead.name.split(" ")[0];
  const about = lead.property
    ? ` sobre ${lead.property.code} (${lead.property.title})`
    : "";
  const greeting = `Hola ${firstName}, te escribo de Siricman Propiedades por tu consulta${about}.`;
  const subject = lead.property
    ? `Tu consulta por ${lead.property.code} · Siricman Propiedades`
    : "Tu consulta · Siricman Propiedades";

  return {
    ...(lead.phone
      ? {
          call: `tel:${lead.phone.replace(/[^\d+]/g, "")}`,
          whatsapp: whatsappToLead(lead.phone, greeting),
        }
      : {}),
    ...(lead.email
      ? { email: `mailto:${lead.email}?subject=${encodeURIComponent(subject)}` }
      : {}),
  };
}
