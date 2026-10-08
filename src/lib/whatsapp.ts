/**
 * Builds a wa.me deep link for a given phone number and prefilled message.
 * Non-digit characters in the phone number are stripped, as required by wa.me.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_PHONE = "5491138967363";
export const WHATSAPP_DEFAULT_MESSAGE = "Hola Gabriel, te escribo desde la web.";
/** Prefilled message for owners who want to sell (home hero and closing call). */
export const WHATSAPP_SELLER_MESSAGE =
  "Hola Gabriel, quiero vender mi propiedad y me gustaría asesorarme.";
