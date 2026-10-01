// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expectRedirect, RedirectError } from "@/test/next-server";
import { makeProperty } from "@/test/fixtures/property";

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
  notFound,
}));

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

const { createProperty, updateProperty } = vi.hoisted(() => ({
  createProperty: vi.fn(),
  updateProperty: vi.fn(),
}));
vi.mock("@/lib/api/properties", () => ({ createProperty, updateProperty }));

const { getSessionToken } = vi.hoisted(() => ({ getSessionToken: vi.fn() }));
vi.mock("@/lib/session/dal", () => ({ getSessionToken }));

import { ApiError } from "@/lib/api/client";
import { createPropertyAction } from "./nueva/actions";
import { updatePropertyAction } from "./[id]/actions";

const VALID_FIELDS: Record<string, string> = {
  operation: "sale",
  type: "apartment",
  title: "Departamento luminoso",
  neighborhoodId: "8f8e2c0e-4a8a-4f43-9a51-2a3c5f9c2b11",
  address: "Av. Santa Fe 1234",
  currency: "USD",
  price: "120.000",
  rooms: "3",
  bedrooms: "2",
  bathrooms: "1",
  coveredArea: "65",
  totalArea: "70",
  age: "15",
  marketingTag: "none",
  hasWater: "on",
};

function formDataFor(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionToken.mockResolvedValue("jwt-1");
});

describe("createPropertyAction", () => {
  it("creates the property and redirects to its editor to add photos", async () => {
    createProperty.mockResolvedValue(makeProperty({ id: "new-id" }));

    await expectRedirect(
      createPropertyAction({}, formDataFor(VALID_FIELDS)),
      "/admin/propiedades/new-id?paso=fotos&creada=1",
    );

    expect(createProperty).toHaveBeenCalledWith(
      "jwt-1",
      expect.objectContaining({
        title: "Departamento luminoso",
        price: 120000,
        hasGarage: false,
      }),
    );
    // Only step 1 fields are created; services, description and tags come later.
    const input = createProperty.mock.calls[0][1];
    expect(input).not.toHaveProperty("hasWater");
    expect(input).not.toHaveProperty("marketingTag");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/propiedades");
  });

  it("returns field errors and the submitted values without calling the API when invalid", async () => {
    const state = await createPropertyAction(
      {},
      formDataFor({ ...VALID_FIELDS, title: "abc" }),
    );

    expect(createProperty).not.toHaveBeenCalled();
    expect(state.fieldErrors?.title).toMatch(/entre 5 y 150/);
    expect(state.values?.title).toBe("abc");
    expect(state.values?.address).toBe("Av. Santa Fe 1234");
  });

  it("maps back validation messages to fields", async () => {
    createProperty.mockRejectedValue(
      new ApiError(400, "x", [
        "price must be a positive number",
        "Neighborhood not found",
      ]),
    );

    const state = await createPropertyAction({}, formDataFor(VALID_FIELDS));

    expect(state.fieldErrors?.price).toBe("price must be a positive number");
    expect(state.fieldErrors?.general).toBe("Neighborhood not found");
    expect(state.values?.address).toBe("Av. Santa Fe 1234");
  });

  it("redirects to the login when the session expired", async () => {
    createProperty.mockRejectedValue(new ApiError(401, "Unauthorized"));

    await expectRedirect(
      createPropertyAction({}, formDataFor(VALID_FIELDS)),
      "/admin/login?reason=expired",
    );
  });

  it("shows a general error when the service is unreachable", async () => {
    createProperty.mockRejectedValue(
      new ApiError(0, "No se pudo contactar al servicio."),
    );

    const state = await createPropertyAction({}, formDataFor(VALID_FIELDS));

    expect(state.fieldErrors?.general).toMatch(/No se pudo guardar/);
  });
});

describe("updatePropertyAction", () => {
  it("updates the property, clearing emptied optional fields, and redirects with a notice", async () => {
    updateProperty.mockResolvedValue(makeProperty());

    await expectRedirect(
      updatePropertyAction("p1", "datos", {}, formDataFor(VALID_FIELDS)),
      "/admin/propiedades/p1?paso=datos&guardada=1",
    );

    expect(updateProperty).toHaveBeenCalledWith(
      "jwt-1",
      "p1",
      expect.objectContaining({ expenses: null, price: 120000 }),
    );
    // A partial PATCH: the datos step never touches the description or services.
    const input = updateProperty.mock.calls[0][2];
    expect(input).not.toHaveProperty("description");
    expect(input).not.toHaveProperty("hasWater");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/propiedades");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/propiedades/p1");
  });

  it("saves only the extras fields for the description step, clearing an emptied description", async () => {
    updateProperty.mockResolvedValue(makeProperty());

    await expectRedirect(
      updatePropertyAction(
        "p1",
        "extras",
        {},
        formDataFor({ marketingTag: "new", description: "", hasWater: "on" }),
      ),
      "/admin/propiedades/p1?paso=descripcion&guardada=1",
    );

    const input = updateProperty.mock.calls[0][2];
    expect(input).toEqual(
      expect.objectContaining({ description: null, marketingTag: "new", hasWater: true }),
    );
    expect(input).not.toHaveProperty("price");
    expect(input).not.toHaveProperty("title");
  });

  it("returns field errors for the step without calling the API", async () => {
    const state = await updatePropertyAction(
      "p1",
      "datos",
      {},
      formDataFor({ ...VALID_FIELDS, price: "" }),
    );

    expect(updateProperty).not.toHaveBeenCalled();
    expect(state.fieldErrors?.price).toBeDefined();
  });

  it("renders the not-found page when the property no longer exists", async () => {
    updateProperty.mockRejectedValue(new ApiError(404, "Not found"));

    await expect(
      updatePropertyAction("p1", "datos", {}, formDataFor(VALID_FIELDS)),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
