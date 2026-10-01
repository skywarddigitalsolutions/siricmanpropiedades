// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expectRedirect, RedirectError } from "@/test/next-server";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

const api = vi.hoisted(() => ({
  uploadPropertyImage: vi.fn(),
  reorderPropertyImages: vi.fn(),
  deletePropertyImage: vi.fn(),
}));
vi.mock("@/lib/api/properties", () => api);

const { getSessionToken } = vi.hoisted(() => ({ getSessionToken: vi.fn() }));
vi.mock("@/lib/session/dal", () => ({ getSessionToken }));

import { ApiError } from "@/lib/api/client";
import {
  deleteImageAction,
  reorderImagesAction,
  uploadImageAction,
} from "./image-actions";

function uploadFormData(file: File | null = new File(["img"], "a.jpg", { type: "image/jpeg" })) {
  const formData = new FormData();
  if (file) formData.set("file", file);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionToken.mockResolvedValue("jwt-1");
});

describe("uploadImageAction", () => {
  it("uploads the file and refreshes the editor", async () => {
    api.uploadPropertyImage.mockResolvedValue({ id: "img-1" });

    const result = await uploadImageAction("p1", uploadFormData());

    expect(result).toEqual({});
    expect(api.uploadPropertyImage).toHaveBeenCalledWith(
      "jwt-1",
      "p1",
      expect.any(File),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/propiedades/p1");
  });

  it("rejects a missing or unsupported file before calling the API", async () => {
    expect((await uploadImageAction("p1", uploadFormData(null))).error).toMatch(/Elegí/);
    expect(
      (
        await uploadImageAction(
          "p1",
          uploadFormData(new File(["x"], "a.gif", { type: "image/gif" })),
        )
      ).error,
    ).toMatch(/JPG, PNG o WebP/);
    expect(api.uploadPropertyImage).not.toHaveBeenCalled();
  });

  it.each([
    [400, "Property already has the maximum of 30 images", /30 fotos/],
    [400, "Unsupported image", /no es una imagen válida/],
    [413, "Payload Too Large", /15 MB/],
    [429, "Too Many Requests", /esperá un minuto/],
    [0, "No se pudo contactar al servicio.", /Probá de nuevo/],
  ])("explains a %i (%s)", async (status, message, expected) => {
    api.uploadPropertyImage.mockRejectedValue(new ApiError(status, message));

    const result = await uploadImageAction("p1", uploadFormData());

    expect(result.error).toMatch(expected);
  });

  it("redirects to the login when the session expired", async () => {
    api.uploadPropertyImage.mockRejectedValue(new ApiError(401, "Unauthorized"));

    await expectRedirect(uploadImageAction("p1", uploadFormData()), "/admin/login?reason=expired");
  });
});

describe("reorderImagesAction", () => {
  it("saves the new order", async () => {
    api.reorderPropertyImages.mockResolvedValue([]);

    const result = await reorderImagesAction("p1", ["b", "a"]);

    expect(result).toEqual({});
    expect(api.reorderPropertyImages).toHaveBeenCalledWith("jwt-1", "p1", ["b", "a"]);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/propiedades/p1");
  });

  it("asks to reload when the photos changed meanwhile", async () => {
    api.reorderPropertyImages.mockRejectedValue(new ApiError(400, "not a permutation"));

    const result = await reorderImagesAction("p1", ["b", "a"]);

    expect(result.error).toMatch(/recargá la página/);
  });
});

describe("deleteImageAction", () => {
  it("deletes the photo", async () => {
    api.deletePropertyImage.mockResolvedValue(undefined);

    const result = await deleteImageAction("p1", "img-1");

    expect(result).toEqual({});
    expect(api.deletePropertyImage).toHaveBeenCalledWith("jwt-1", "p1", "img-1");
  });

  it("treats an already deleted photo as done", async () => {
    api.deletePropertyImage.mockRejectedValue(new ApiError(404, "Not found"));

    const result = await deleteImageAction("p1", "img-1");

    expect(result).toEqual({});
    expect(revalidatePath).toHaveBeenCalledWith("/admin/propiedades/p1");
  });
});
