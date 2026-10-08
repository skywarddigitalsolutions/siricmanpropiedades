import { describe, expect, it } from "vitest";
import { contactValues, mapContactApiErrors, parseContactForm } from "./contact-form";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("parseContactForm", () => {
  it("accepts the rental management topic", () => {
    expect(
      parseContactForm(form({ name: "Ana", contact: "ana@correo.com", topic: "rental_management" })),
    ).toEqual({ input: { name: "Ana", email: "ana@correo.com", topic: "rental_management" } });
  });

  it("sends a phone when the contact field has no @", () => {
    expect(
      parseContactForm(
        form({ name: " Ana García ", contact: " 11 3896-7363 ", topic: "buy", message: " Hola " }),
      ),
    ).toEqual({
      input: { name: "Ana García", phone: "11 3896-7363", topic: "buy", message: "Hola" },
    });
  });

  it("sends an email when the contact field has an @", () => {
    expect(
      parseContactForm(form({ name: "Ana", contact: "ana@correo.com", topic: "other" })),
    ).toEqual({ input: { name: "Ana", email: "ana@correo.com", topic: "other" } });
  });

  it("keeps the honeypot so the API can drop bots", () => {
    const result = parseContactForm(
      form({ name: "Bot", contact: "11 3896-7363", topic: "other", website: "x.com" }),
    );

    expect(result).toMatchObject({ input: { website: "x.com" } });
  });

  it("asks for a way to reply", () => {
    expect(parseContactForm(form({ name: "Ana", contact: "  ", topic: "buy" }))).toEqual({
      fieldErrors: { contact: "Dejanos un teléfono o un email para responderte." },
    });
  });

  it("validates each field", () => {
    expect(
      parseContactForm(form({ name: "A", contact: "llamame", topic: "nada", message: "x".repeat(2001) })),
    ).toEqual({
      fieldErrors: {
        name: "Escribí tu nombre (2 a 100 caracteres).",
        contact: "Revisá el teléfono.",
        topic: "Elegí un motivo de consulta.",
        message: "El mensaje puede tener hasta 2000 caracteres.",
      },
    });
    expect(parseContactForm(form({ name: "Ana", contact: "ana@", topic: "buy" }))).toEqual({
      fieldErrors: { contact: "Revisá el email." },
    });
  });
});

describe("mapContactApiErrors", () => {
  it("points phone and email errors at the single contact field", () => {
    expect(mapContactApiErrors(["email must be an email"])).toEqual({ contact: "Revisá el email." });
    expect(mapContactApiErrors(["phone must match"])).toEqual({ contact: "Revisá el teléfono." });
    expect(mapContactApiErrors(["name too short"])).toEqual({
      name: "Escribí tu nombre (2 a 100 caracteres).",
    });
  });
});

describe("contactValues", () => {
  it("returns what the visitor typed", () => {
    expect(
      contactValues(form({ name: " Ana ", contact: "11 1", topic: "rent", message: "Hola" })),
    ).toEqual({ name: "Ana", contact: "11 1", topic: "rent", message: "Hola" });
  });
});
