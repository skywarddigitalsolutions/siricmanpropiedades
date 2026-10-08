import { describe, expect, it } from "vitest";
import {
  RENTAL_MESSAGE_MAX,
  mapRentalApiErrors,
  parseRentalForm,
  rentalValues,
} from "./rental-management-form";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const VALID = {
  name: "Ana García",
  contact: "ana@correo.com",
  address: "Av. Rivadavia 1234, Caballito",
  rented: "yes",
  message: "Tengo contrato hasta 2027.",
};

describe("parseRentalForm", () => {
  it("builds a rental_management contact lead and folds the property data into the message", () => {
    expect(parseRentalForm(form(VALID))).toEqual({
      input: {
        type: "contact",
        topic: "rental_management",
        name: "Ana García",
        email: "ana@correo.com",
        message:
          "Dirección de la propiedad: Av. Rivadavia 1234, Caballito\n¿Está alquilada?: Sí, ya tiene inquilino\n\nTengo contrato hasta 2027.",
      },
    });
  });

  it("sends a phone when the contact is not an email and skips the empty message", () => {
    expect(
      parseRentalForm(form({ ...VALID, contact: "11 3896-7363", rented: "no", message: "" })),
    ).toEqual({
      input: {
        type: "contact",
        topic: "rental_management",
        name: "Ana García",
        phone: "11 3896-7363",
        message:
          "Dirección de la propiedad: Av. Rivadavia 1234, Caballito\n¿Está alquilada?: No, la quiero alquilar",
      },
    });
  });

  it("requires the property address", () => {
    expect(parseRentalForm(form({ ...VALID, address: " " }))).toMatchObject({
      fieldErrors: { address: expect.stringMatching(/dirección/i) },
    });
  });

  it("requires a valid rental status", () => {
    for (const rented of ["", "maybe"]) {
      expect(parseRentalForm(form({ ...VALID, rented }))).toMatchObject({
        fieldErrors: { rented: expect.any(String) },
      });
    }
  });

  it("caps the message", () => {
    expect(parseRentalForm(form({ ...VALID, message: "x".repeat(RENTAL_MESSAGE_MAX + 1) }))).toMatchObject({
      fieldErrors: { message: expect.any(String) },
    });
  });

  it("reuses the contact errors for name and contact", () => {
    expect(parseRentalForm(form({ ...VALID, name: "", contact: "" }))).toMatchObject({
      fieldErrors: { name: expect.any(String), contact: expect.stringMatching(/teléfono o un email/) },
    });
  });

  it("keeps the honeypot so the API can drop bots", () => {
    expect(parseRentalForm(form({ ...VALID, website: "http://spam" }))).toMatchObject({
      input: { website: "http://spam" },
    });
  });
});

describe("rentalValues", () => {
  it("returns what was typed to refill the form", () => {
    expect(rentalValues(form(VALID))).toEqual(VALID);
  });
});

describe("mapRentalApiErrors", () => {
  it("maps the email error to the contact field", () => {
    expect(mapRentalApiErrors(["email must be an email"])).toEqual({ contact: "Revisá el email." });
  });
});
