// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { submitLead } = vi.hoisted(() => ({ submitLead: vi.fn() }));
vi.mock("@/lib/api/leads", () => ({ submitLead }));

import { ApiError } from "@/lib/api/client";
import { sendAppraisalAction } from "./actions";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const VALID = {
  operation: "sell",
  propertyType: "house",
  address: "Las Casas 4054",
  neighborhood: "Boedo",
  rooms: "4",
  area: "120",
  name: "Ana García",
  phone: "11 3896-7363",
  message: "Hola",
};

beforeEach(() => {
  submitLead.mockReset();
  submitLead.mockResolvedValue({ received: true });
});

describe("sendAppraisalAction", () => {
  it("sends an appraisal lead with its topic and details and confirms it", async () => {
    const state = await sendAppraisalAction({ status: "idle" }, form(VALID));

    expect(submitLead).toHaveBeenCalledWith({
      type: "appraisal",
      name: "Ana García",
      phone: "11 3896-7363",
      message: "Hola",
      topic: "sell",
      details: { propertyType: "house", address: "Las Casas 4054", neighborhood: "Boedo", rooms: 4, area: 120 },
    });
    expect(state).toEqual({ status: "sent" });
  });

  it("sends a lead with just a name and a phone, without details", async () => {
    const state = await sendAppraisalAction(
      { status: "idle" },
      form({ operation: "rent", name: "Ana García", phone: "11 3896-7363" }),
    );

    expect(submitLead).toHaveBeenCalledWith({
      type: "appraisal",
      name: "Ana García",
      phone: "11 3896-7363",
      topic: "rent",
    });
    expect(state).toEqual({ status: "sent" });
  });

  it("returns field errors and the typed values without calling the API", async () => {
    const state = await sendAppraisalAction({ status: "idle" }, form({ ...VALID, phone: "", rooms: "99" }));

    expect(submitLead).not.toHaveBeenCalled();
    expect(state.status).toBe("error");
    expect(state.fieldErrors?.phone).toBe("Dejanos un teléfono para responderte.");
    expect(state.fieldErrors?.rooms).toMatch(/0 a 50/);
    expect(state.values).toMatchObject({
      name: "Ana García",
      address: "Las Casas 4054",
      neighborhood: "Boedo",
      rooms: "99",
    });
  });

  it.each([
    [new ApiError(429, "Too Many Requests"), /en un minuto/],
    [new ApiError(0, "No se pudo contactar al servicio."), /Probá de nuevo/],
    [new ApiError(500, "boom"), /Probá de nuevo/],
  ])("explains %s", async (error, expected) => {
    submitLead.mockRejectedValue(error);

    const state = await sendAppraisalAction({ status: "idle" }, form(VALID));

    expect(state.status).toBe("error");
    expect(state.fieldErrors?.general).toMatch(expected);
    expect(state.values).toMatchObject({ address: "Las Casas 4054" });
  });

  it("maps API validation errors, including details.*, to their fields", async () => {
    submitLead.mockRejectedValue(
      new ApiError(400, "x", ["details.area must be an integer number", "phone must be a valid phone number"]),
    );

    const state = await sendAppraisalAction({ status: "idle" }, form(VALID));

    expect(state.fieldErrors).toEqual({
      area: "La superficie debe ser un número entero de 0 a 1000000 m².",
      phone: "Revisá el teléfono.",
    });
  });
});
