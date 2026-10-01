// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { submitLead } = vi.hoisted(() => ({ submitLead: vi.fn() }));
vi.mock("@/lib/api/leads", () => ({ submitLead }));

import { ApiError } from "@/lib/api/client";
import { sendInquiryAction } from "./actions";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const VALID = { name: "Ana García", phone: "11 3896-7363", message: "Hola" };

beforeEach(() => {
  submitLead.mockReset();
  submitLead.mockResolvedValue({ received: true });
});

describe("sendInquiryAction", () => {
  it("sends a property inquiry and confirms it", async () => {
    const state = await sendInquiryAction("p1", { status: "idle" }, form(VALID));

    expect(submitLead).toHaveBeenCalledWith({
      type: "property_inquiry",
      propertyId: "p1",
      name: "Ana García",
      phone: "11 3896-7363",
      message: "Hola",
    });
    expect(state).toEqual({ status: "sent" });
  });

  it("returns field errors and the typed values without calling the API", async () => {
    const state = await sendInquiryAction(
      "p1",
      { status: "idle" },
      form({ name: "Ana", phone: "", email: "", message: "Hola" }),
    );

    expect(submitLead).not.toHaveBeenCalled();
    expect(state.status).toBe("error");
    expect(state.fieldErrors?.phone).toMatch(/teléfono o un email/);
    expect(state.values).toMatchObject({ name: "Ana", message: "Hola" });
  });

  it.each([
    [new ApiError(429, "Too Many Requests"), /en un minuto/],
    [new ApiError(400, "Property not found"), /ya no está publicada/],
    [new ApiError(0, "No se pudo contactar al servicio."), /Probá de nuevo/],
  ])("explains %s", async (error, expected) => {
    submitLead.mockRejectedValue(error);

    const state = await sendInquiryAction("p1", { status: "idle" }, form(VALID));

    expect(state.status).toBe("error");
    expect(state.fieldErrors?.general).toMatch(expected);
  });

  it("maps API validation errors to fields", async () => {
    submitLead.mockRejectedValue(
      new ApiError(400, "x", ["email must be an email"]),
    );

    const state = await sendInquiryAction("p1", { status: "idle" }, form(VALID));

    expect(state.fieldErrors).toEqual({ email: "Revisá el email." });
  });
});
