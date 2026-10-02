import { describe, expect, it } from "vitest";
import { consortiumValues, parseConsortiumForm } from "./consortium-form";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const VALID = {
  name: "Ana García",
  contact: "ana@correo.com",
  address: "Av. Rivadavia 1234, Caballito",
  units: "24",
  message: "Queremos cambiar de administración.",
};

describe("parseConsortiumForm", () => {
  it("builds a consortium contact lead and folds the building data into the message", () => {
    const parsed = parseConsortiumForm(form(VALID));

    expect(parsed).toEqual({
      input: {
        type: "contact",
        topic: "consortium",
        name: "Ana García",
        email: "ana@correo.com",
        message:
          "Dirección del edificio: Av. Rivadavia 1234, Caballito\nUnidades aproximadas: 24\n\nQueremos cambiar de administración.",
      },
    });
  });

  it("sends a phone when the contact is not an email and skips the empty optionals", () => {
    const parsed = parseConsortiumForm(
      form({ ...VALID, contact: "11 3896-7363", units: "", message: "" }),
    );

    expect(parsed).toEqual({
      input: {
        type: "contact",
        topic: "consortium",
        name: "Ana García",
        phone: "11 3896-7363",
        message: "Dirección del edificio: Av. Rivadavia 1234, Caballito",
      },
    });
  });

  it("requires the building address", () => {
    const parsed = parseConsortiumForm(form({ ...VALID, address: " " }));

    expect(parsed).toMatchObject({ fieldErrors: { address: expect.stringMatching(/dirección/i) } });
  });

  it("rejects units that are not a positive whole number", () => {
    for (const units of ["0", "-3", "2.5", "mucho", "100000"]) {
      expect(parseConsortiumForm(form({ ...VALID, units }))).toMatchObject({
        fieldErrors: { units: expect.any(String) },
      });
    }
  });

  it("reuses the contact errors for name and contact", () => {
    const parsed = parseConsortiumForm(form({ ...VALID, name: "", contact: "" }));

    expect(parsed).toMatchObject({
      fieldErrors: { name: expect.any(String), contact: expect.stringMatching(/teléfono o un email/) },
    });
  });

  it("keeps the honeypot so the API can drop bots", () => {
    const parsed = parseConsortiumForm(form({ ...VALID, website: "http://spam" }));

    expect(parsed).toMatchObject({ input: { website: "http://spam" } });
  });
});

describe("consortiumValues", () => {
  it("returns what was typed to refill the form", () => {
    expect(consortiumValues(form(VALID))).toEqual({
      name: "Ana García",
      contact: "ana@correo.com",
      address: "Av. Rivadavia 1234, Caballito",
      units: "24",
      message: "Queremos cambiar de administración.",
    });
  });
});
