import { describe, expect, it } from "vitest";
import { leadContactLinks } from "./contact-links";

const base = {
  name: "Ana García",
  phone: "11 3896-7363",
  email: "ana@mail.com",
  property: { id: "p1", code: "SP-0007", title: "Casa en Palermo", slug: "casa" },
};

describe("leadContactLinks", () => {
  it("builds call, WhatsApp and email links greeting the visitor by first name", () => {
    const links = leadContactLinks(base);

    expect(links.call).toBe("tel:1138967363");
    expect(links.whatsapp).toBe(
      `https://wa.me/5491138967363?text=${encodeURIComponent(
        "Hola Ana, te escribo de Siricman Propiedades por tu consulta sobre SP-0007 (Casa en Palermo).",
      )}`,
    );
    expect(links.email).toBe(
      `mailto:ana@mail.com?subject=${encodeURIComponent("Tu consulta por SP-0007 · Siricman Propiedades")}`,
    );
  });

  it("strips ? and & from the email so it cannot inject mailto fields", () => {
    const links = leadContactLinks({ ...base, email: "a@b.com?bcc=x@evil.com&cc=y@evil.com" });

    expect(links.email).toMatch(/^mailto:a@b\.combcc=x@evil\.comcc=y@evil\.com\?subject=/);
  });

  it("keeps the + of international numbers and omits what the visitor didn't leave", () => {
    const links = leadContactLinks({ ...base, phone: "+54 9 11 3896-7363", email: null, property: null });

    expect(links.call).toBe("tel:+5491138967363");
    expect(links.email).toBeUndefined();
    expect(decodeURIComponent(links.whatsapp!)).toContain("por tu consulta.");
    expect(leadContactLinks({ ...base, phone: null }).call).toBeUndefined();
  });
});
