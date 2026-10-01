import { describe, expect, it } from "vitest";
import { mapLeadApiErrors, parseInquiryForm } from "./inquiry-form";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("parseInquiryForm", () => {
  it("returns the trimmed input when valid", () => {
    expect(
      parseInquiryForm(
        form({ name: "  Ana García ", phone: " 11 3896-7363 ", email: "", message: " Hola " }),
      ),
    ).toEqual({ input: { name: "Ana García", phone: "11 3896-7363", message: "Hola" } });
  });

  it("asks for a phone or an email", () => {
    const result = parseInquiryForm(form({ name: "Ana", phone: "", email: "" }));

    expect(result).toEqual({
      fieldErrors: { phone: "Dejanos un teléfono o un email para responderte." },
    });
  });

  it("validates each field", () => {
    const result = parseInquiryForm(
      form({ name: "A", phone: "llamame", email: "ana@", message: "x".repeat(2001) }),
    );

    expect(result).toEqual({
      fieldErrors: {
        name: "Escribí tu nombre (2 a 100 caracteres).",
        phone: "Revisá el teléfono.",
        email: "Revisá el email.",
        message: "El mensaje puede tener hasta 2000 caracteres.",
      },
    });
  });

  it("passes the honeypot through so the API can drop bots", () => {
    const result = parseInquiryForm(
      form({ name: "Bot", email: "bot@example.com", website: "http://spam" }),
    );

    expect(result).toEqual({
      input: { name: "Bot", email: "bot@example.com", website: "http://spam" },
    });
  });
});

describe("mapLeadApiErrors", () => {
  it("maps back validation messages to fields", () => {
    expect(
      mapLeadApiErrors(["phone must be a valid phone number", "email must be an email", "other"]),
    ).toEqual({
      phone: "Revisá el teléfono.",
      email: "Revisá el email.",
      general: "No pudimos enviar la consulta. Revisá los datos e intentá de nuevo.",
    });
  });
});
