// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { submitLead } = vi.hoisted(() => ({ submitLead: vi.fn() }));
vi.mock("@/lib/api/leads", () => ({ submitLead }));

import { ApiError } from "@/lib/api/client";
import { sendRentalAction } from "./actions";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const VALID = {
  name: "Ana García",
  contact: "ana@correo.com",
  address: "Av. Rivadavia 1234",
  rented: "yes",
  message: "Hola",
};

beforeEach(() => {
  submitLead.mockReset();
  submitLead.mockResolvedValue({ received: true });
});

describe("sendRentalAction", () => {
  it("sends a contact lead with the rental_management topic and confirms it", async () => {
    const state = await sendRentalAction({ status: "idle" }, form(VALID));

    expect(submitLead).toHaveBeenCalledWith({
      type: "contact",
      topic: "rental_management",
      name: "Ana García",
      email: "ana@correo.com",
      message: "Dirección de la propiedad: Av. Rivadavia 1234\n¿Está alquilada?: Sí, ya tiene inquilino\n\nHola",
    });
    expect(state).toEqual({ status: "sent" });
  });

  it("returns field errors and the typed values without calling the API", async () => {
    const state = await sendRentalAction({ status: "idle" }, form({ ...VALID, address: "" }));

    expect(submitLead).not.toHaveBeenCalled();
    expect(state.status).toBe("error");
    expect(state.fieldErrors?.address).toBeDefined();
    expect(state.values).toMatchObject({ name: "Ana García", message: "Hola" });
  });

  it.each([
    [new ApiError(429, "Too Many Requests"), /en un minuto/],
    [new ApiError(0, "No se pudo contactar al servicio."), /Probá de nuevo/],
  ])("explains %s", async (error, expected) => {
    submitLead.mockRejectedValue(error);

    const state = await sendRentalAction({ status: "idle" }, form(VALID));

    expect(state.status).toBe("error");
    expect(state.fieldErrors?.general).toMatch(expected);
  });

  it("maps API validation errors to the contact field", async () => {
    submitLead.mockRejectedValue(new ApiError(400, "x", ["email must be an email"]));

    const state = await sendRentalAction({ status: "idle" }, form(VALID));

    expect(state.fieldErrors).toEqual({ contact: "Revisá el email." });
  });
});
