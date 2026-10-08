import { describe, expect, it } from "vitest";
import { WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE, buildWhatsAppLink } from "./whatsapp";

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link with the phone and url-encoded message", () => {
    const link = buildWhatsAppLink("5491138967363", "Hola Gabriel, te escribo desde la web.");

    expect(link).toBe(
      "https://wa.me/5491138967363?text=Hola%20Gabriel%2C%20te%20escribo%20desde%20la%20web.",
    );
  });

  it("strips non-digit characters from the phone number", () => {
    const link = buildWhatsAppLink("+54 9 11 3896-7363", "Hola");

    expect(link).toBe("https://wa.me/5491138967363?text=Hola");
  });

  it("url-encodes special characters and accents in the message", () => {
    const link = buildWhatsAppLink("5491138967363", "¿Está disponible? ¡Sí!");

    expect(link).toBe(
      `https://wa.me/5491138967363?text=${encodeURIComponent("¿Está disponible? ¡Sí!")}`,
    );
  });

  it("encodes line breaks as %0A", () => {
    expect(buildWhatsAppLink("5491138967363", "uno\ndos")).toBe(
      "https://wa.me/5491138967363?text=uno%0Ados",
    );
  });
});

describe("WHATSAPP_SELLER_MESSAGE", () => {
  it("is a template listing the property details to send", () => {
    const lines = WHATSAPP_SELLER_MESSAGE.split("\n");
    expect(lines[0]).toBe(
      "Hola Gabriel, quiero vender mi propiedad y me gustaría pedir una tasación. Te paso los datos:",
    );
    expect(lines.slice(1)).toEqual([
      "- Tipo de propiedad (departamento, casa, PH, etc.):",
      "- Dirección y barrio:",
      "- Ambientes:",
      "- Superficie aproximada (m²):",
      "- Estado y extras (balcón, cochera, amenities):",
      "- Mi nombre:",
    ]);
  });

  it("is carried by the link with encoded newlines", () => {
    const link = buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE);

    expect(link).toContain("%0A-%20Direcci%C3%B3n%20y%20barrio%3A");
    expect(link).toContain("%0A-%20Superficie%20aproximada%20(m%C2%B2)%3A");
    expect(link).not.toContain("\n");
    expect(decodeURIComponent(link.split("?text=")[1])).toBe(WHATSAPP_SELLER_MESSAGE);
  });
});
