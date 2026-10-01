// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expectRedirect, RedirectError } from "@/test/next-server";
import { makeProperty } from "@/test/fixtures/property";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

const api = vi.hoisted(() => ({
  publishProperty: vi.fn(),
  archiveProperty: vi.fn(),
  unpublishProperty: vi.fn(),
  updateDealStatus: vi.fn(),
  deleteProperty: vi.fn(),
}));
vi.mock("@/lib/api/properties", () => api);

const { getSessionToken } = vi.hoisted(() => ({ getSessionToken: vi.fn() }));
vi.mock("@/lib/session/dal", () => ({ getSessionToken }));

import { ApiError } from "@/lib/api/client";
import {
  changeDealStatusAction,
  changePublicationAction,
  deletePropertyAction,
} from "./lifecycle-actions";

function formDataFor(fields: Record<string, string> = {}): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionToken.mockResolvedValue("jwt-1");
});

describe("changePublicationAction", () => {
  it.each([
    ["publish", "publishProperty", "Propiedad publicada."],
    ["archive", "archiveProperty", "Propiedad archivada."],
    ["unpublish", "unpublishProperty", "La propiedad volvió a borrador."],
  ] as const)("runs %s and confirms it", async (transition, fn, message) => {
    api[fn].mockResolvedValue(makeProperty());

    const state = await changePublicationAction(
      "p1",
      {},
      formDataFor({ transition }),
    );

    expect(api[fn]).toHaveBeenCalledWith("jwt-1", "p1");
    expect(state).toEqual({ message });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/propiedades");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/propiedades/p1");
  });

  it("rejects an unknown transition without calling the API", async () => {
    const state = await changePublicationAction(
      "p1",
      {},
      formDataFor({ transition: "delete" }),
    );

    expect(state.error).toBeDefined();
    expect(api.publishProperty).not.toHaveBeenCalled();
  });

  it("explains a transition the back refuses", async () => {
    api.publishProperty.mockRejectedValue(new ApiError(400, "Invalid transition"));

    const state = await changePublicationAction(
      "p1",
      {},
      formDataFor({ transition: "publish" }),
    );

    expect(state.error).toMatch(/recargá la página/i);
  });

  it("redirects to the login when the session expired", async () => {
    api.archiveProperty.mockRejectedValue(new ApiError(401, "Unauthorized"));

    await expectRedirect(
      changePublicationAction("p1", {}, formDataFor({ transition: "archive" })),
      "/admin/login?reason=expired",
    );
  });
});

describe("changeDealStatusAction", () => {
  it("updates the deal status", async () => {
    api.updateDealStatus.mockResolvedValue(makeProperty());

    const state = await changeDealStatusAction(
      "p1",
      {},
      formDataFor({ dealStatus: "reserved" }),
    );

    expect(api.updateDealStatus).toHaveBeenCalledWith("jwt-1", "p1", "reserved");
    expect(state).toEqual({ message: "Estado comercial actualizado." });
  });

  it("rejects an unknown status without calling the API", async () => {
    const state = await changeDealStatusAction(
      "p1",
      {},
      formDataFor({ dealStatus: "lost" }),
    );

    expect(state.error).toBeDefined();
    expect(api.updateDealStatus).not.toHaveBeenCalled();
  });

  it("explains an incompatible status instead of claiming it is already set", async () => {
    api.updateDealStatus.mockRejectedValue(
      new ApiError(400, 'Deal status "sold" is only allowed for sale properties'),
    );

    const state = await changeDealStatusAction(
      "p1",
      {},
      formDataFor({ dealStatus: "sold" }),
    );

    expect(state.error).toMatch(/no corresponde a la operación/);
  });

  it("renders not found when the property is gone", async () => {
    api.updateDealStatus.mockRejectedValue(new ApiError(404, "Not found"));

    await expect(
      changeDealStatusAction("p1", {}, formDataFor({ dealStatus: "sold" })),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("deletePropertyAction", () => {
  it("deletes and returns to the list with a notice", async () => {
    api.deleteProperty.mockResolvedValue(undefined);

    await expectRedirect(
      deletePropertyAction("p1"),
      "/admin/propiedades?eliminada=1",
    );

    expect(api.deleteProperty).toHaveBeenCalledWith("jwt-1", "p1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/propiedades");
  });

  it("explains that a published property must be archived instead", async () => {
    api.deleteProperty.mockRejectedValue(new ApiError(400, "already published"));

    const state = await deletePropertyAction("p1");

    expect(state.error).toMatch(/archivala/);
  });

  it("explains that only admins can delete", async () => {
    api.deleteProperty.mockRejectedValue(new ApiError(403, "Forbidden"));

    const state = await deletePropertyAction("p1");

    expect(state.error).toMatch(/administrador/);
  });
});
