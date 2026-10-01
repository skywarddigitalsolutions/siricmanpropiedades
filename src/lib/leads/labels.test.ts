import { describe, expect, it } from "vitest";
import { LEAD_STATUS_LABELS, LEAD_TYPE_LABELS, LEAD_TOPIC_LABELS, whatsappToLead } from "./labels";

describe("lead labels", () => {
  it("names every status, type and topic in Spanish", () => {
    expect(LEAD_STATUS_LABELS).toEqual({ new: "Nueva", contacted: "Contactada", closed: "Cerrada" });
    expect(LEAD_TYPE_LABELS.property_inquiry).toBe("Consulta por propiedad");
    expect(LEAD_TOPIC_LABELS.sell).toBe("Quiere vender o tasar");
  });
});

describe("whatsappToLead", () => {
  it("links to the visitor's phone in international format", () => {
    expect(whatsappToLead("11 3896-7363", "Hola Ana")).toBe(
      "https://wa.me/5491138967363?text=Hola%20Ana",
    );
    expect(whatsappToLead("+54 9 11 3896-7363", "Hola")).toBe(
      "https://wa.me/5491138967363?text=Hola",
    );
  });
});
