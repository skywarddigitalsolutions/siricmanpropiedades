import { describe, expect, it } from "vitest";
import { buildWhatsAppLink } from "./whatsapp";

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
});
