import { describe, expect, it } from "vitest";
import { appraisalValues, mapAppraisalApiErrors, parseAppraisalForm } from "./appraisal-form";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const VALID = {
  operation: "sell",
  propertyType: "apartment",
  address: " Las Casas 4054 ",
  neighborhood: " Boedo ",
  rooms: "3",
  area: "62",
  name: " Ana García ",
  phone: " 11 3896-7363 ",
  message: " Hola ",
};

describe("parseAppraisalForm", () => {
  it("builds the lead input with its topic and property details", () => {
    expect(parseAppraisalForm(form(VALID))).toEqual({
      input: {
        name: "Ana García",
        phone: "11 3896-7363",
        message: "Hola",
        topic: "sell",
        details: {
          propertyType: "apartment",
          address: "Las Casas 4054",
          neighborhood: "Boedo",
          rooms: 3,
          area: 62,
        },
      },
    });
  });

  it("maps renting to the rent topic and leaves optional fields out", () => {
    expect(
      parseAppraisalForm(
        form({ operation: "rent", propertyType: "ph", address: "Boedo", name: "Ana", phone: "11 3896-7363" }),
      ),
    ).toEqual({
      input: {
        name: "Ana",
        phone: "11 3896-7363",
        topic: "rent",
        details: { propertyType: "ph", address: "Boedo" },
      },
    });
  });

  it("keeps the honeypot so the API can drop bots", () => {
    expect(parseAppraisalForm(form({ ...VALID, website: "x.com" }))).toMatchObject({
      input: { website: "x.com" },
    });
  });

  it("accepts zero rooms (monoambiente, terreno)", () => {
    expect(parseAppraisalForm(form({ ...VALID, rooms: "0" }))).toMatchObject({
      input: { details: { rooms: 0 } },
    });
  });

  it("only needs a name and a phone: the property data is optional", () => {
    expect(
      parseAppraisalForm(
        form({ operation: "sell", propertyType: "", address: " ", neighborhood: "", name: "Ana", phone: "11 3896-7363" }),
      ),
    ).toEqual({ input: { name: "Ana", phone: "11 3896-7363", topic: "sell" } });
  });

  it("requires a name, a phone and an operation, without mentioning an email", () => {
    expect(parseAppraisalForm(form({ name: "", phone: "", operation: "" }))).toEqual({
      fieldErrors: {
        name: "Escribí tu nombre (2 a 100 caracteres).",
        phone: "Dejanos un teléfono para responderte.",
        operation: "Elegí si querés vender o alquilar.",
      },
    });
  });

  it("validates each field against the API limits", () => {
    expect(
      parseAppraisalForm(
        form({
          ...VALID,
          name: "A",
          phone: "llamame",
          address: "x".repeat(201),
          neighborhood: "x".repeat(101),
          propertyType: "castle",
          rooms: "51",
          area: "1000001",
          message: "x".repeat(2001),
        }),
      ),
    ).toEqual({
      fieldErrors: {
        name: "Escribí tu nombre (2 a 100 caracteres).",
        phone: "Revisá el teléfono.",
        address: "La dirección puede tener hasta 200 caracteres.",
        neighborhood: "Elegí un barrio de la lista.",
        propertyType: "Elegí el tipo de propiedad.",
        rooms: "Los ambientes deben ser un número entero de 0 a 50.",
        area: "La superficie debe ser un número entero de 0 a 1000000 m².",
        message: "El mensaje puede tener hasta 2000 caracteres.",
      },
    });
  });

  it.each(["2.5", "abc", "-1"])("rejects %s as rooms", (rooms) => {
    expect(parseAppraisalForm(form({ ...VALID, rooms }))).toMatchObject({
      fieldErrors: { rooms: expect.any(String) },
    });
  });
});

describe("mapAppraisalApiErrors", () => {
  it("maps nested details.* messages to their fields", () => {
    expect(
      mapAppraisalApiErrors([
        "details.rooms must not be greater than 50",
        "details.area must be an integer number",
        "details.propertyType must be one of the following values: apartment",
        "details.address must be shorter than or equal to 200 characters",
        "details.neighborhood must be shorter than or equal to 100 characters",
      ]),
    ).toEqual({
      rooms: "Los ambientes deben ser un número entero de 0 a 50.",
      area: "La superficie debe ser un número entero de 0 a 1000000 m².",
      propertyType: "Elegí el tipo de propiedad.",
      address: "La dirección puede tener hasta 200 caracteres.",
      neighborhood: "Elegí un barrio de la lista.",
    });
  });

  it("maps top-level fields and falls back to a general error", () => {
    expect(mapAppraisalApiErrors(["name too short", "phone must match", "message too long"])).toEqual({
      name: "Escribí tu nombre (2 a 100 caracteres).",
      phone: "Revisá el teléfono.",
      message: "El mensaje puede tener hasta 2000 caracteres.",
    });
    expect(mapAppraisalApiErrors(["topic must be valid"])).toEqual({
      general: "No pudimos enviar la consulta. Revisá los datos e intentá de nuevo.",
    });
  });
});

describe("appraisalValues", () => {
  it("returns what the visitor typed", () => {
    expect(appraisalValues(form(VALID))).toEqual({
      operation: "sell",
      propertyType: "apartment",
      address: "Las Casas 4054",
      neighborhood: "Boedo",
      rooms: "3",
      area: "62",
      name: "Ana García",
      phone: "11 3896-7363",
      message: "Hola",
    });
  });
});
