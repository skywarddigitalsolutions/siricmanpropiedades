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
/**
 * Prefilled template for owners who want to sell or get an appraisal (home
 * hero, closing call and /vender): the user completes the details and sends it.
 */
export const WHATSAPP_SELLER_MESSAGE = [
  "Hola Gabriel, quiero vender mi propiedad y me gustaría pedir una tasación. Te paso los datos:",
  "- Tipo de propiedad (departamento, casa, PH, etc.):",
  "- Dirección y barrio:",
  "- Ambientes:",
  "- Superficie aproximada (m²):",
  "- Estado y extras (balcón, cochera, amenities):",
  "- Mi nombre:",
].join("\n");
