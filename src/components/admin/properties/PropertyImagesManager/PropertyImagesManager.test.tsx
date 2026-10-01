import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PropertyImage } from "@/lib/api/properties";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import { MAX_IMAGE_BYTES } from "@/lib/properties/images";

const { dnd, compressImage } = vi.hoisted(() => ({
  dnd: { onDragEnd: null as null | ((event: unknown) => void) },
  compressImage: vi.fn(),
}));

// Capture the DndContext handler: jsdom has no layout, so a real drag cannot be simulated.
vi.mock("@dnd-kit/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/core")>();
  return {
    ...actual,
    DndContext: (props: React.ComponentProps<typeof actual.DndContext>) => {
      dnd.onDragEnd = props.onDragEnd as (event: unknown) => void;
      return <actual.DndContext {...props} />;
    },
  };
});
vi.mock("@/lib/properties/image-compression", () => ({ compressImage }));

import PropertyImagesManager from "./PropertyImagesManager";

beforeEach(() => {
  compressImage.mockReset();
  compressImage.mockImplementation(async (file: File) => file);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function image(id: string): PropertyImage {
  return {
    id,
    position: 0,
    url: `https://media.test/${id}.webp`,
    width: 1600,
    height: 1200,
    thumbnailUrl: `https://media.test/${id}-thumb.webp`,
    thumbnailWidth: 480,
    thumbnailHeight: 360,
    createdAt: "2024-01-01",
  };
}

function setup(images: PropertyImage[] = [image("a"), image("b"), image("c")]) {
  const actions = {
    uploadAction: vi.fn<(formData: FormData) => Promise<ActionFeedback>>(async () => ({})),
    reorderAction: vi.fn<(ids: string[]) => Promise<ActionFeedback>>(async () => ({})),
    deleteAction: vi.fn<(imageId: string) => Promise<ActionFeedback>>(async () => ({})),
  };
  render(<PropertyImagesManager images={images} {...actions} />);
  return { user: userEvent.setup(), ...actions };
}

function photoIds() {
  return screen
    .getAllByRole("img")
    .map((img) => img.getAttribute("src")?.match(/\/(\w)-thumb/)?.[1]);
}

describe("PropertyImagesManager", () => {
  it("shows the photos in order with the first one marked as cover", () => {
    setup();

    expect(photoIds()).toEqual(["a", "b", "c"]);
    expect(screen.getByAltText("Foto 1 (portada)")).toBeInTheDocument();
    expect(screen.getByText("3 de 30 fotos")).toBeInTheDocument();
  });

  it("shows an empty state without photos", () => {
    setup([]);

    expect(screen.getByText(/Todavía no hay fotos/)).toBeInTheDocument();
  });

  it("moves a photo and saves the new order", async () => {
    const { user, reorderAction } = setup();

    await user.click(screen.getByRole("button", { name: "Mover la foto 1 después" }));

    expect(photoIds()).toEqual(["b", "a", "c"]);
    expect(reorderAction).toHaveBeenCalledWith(["b", "a", "c"]);
  });

  it("sets a photo as cover by moving it first", async () => {
    const { user, reorderAction } = setup();

    await user.click(screen.getByRole("button", { name: "Usar la foto 3 como portada" }));

    expect(reorderAction).toHaveBeenCalledWith(["c", "a", "b"]);
  });

  it("restores the order and shows the error when saving fails", async () => {
    const { user, reorderAction } = setup();
    reorderAction.mockResolvedValue({ error: "Las fotos cambiaron mientras tanto." });

    await user.click(screen.getByRole("button", { name: "Mover la foto 2 antes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Las fotos cambiaron mientras tanto.");
    expect(photoIds()).toEqual(["a", "b", "c"]);
  });

  it("deletes a photo only after confirming", async () => {
    const { user, deleteAction } = setup();

    await user.click(screen.getByRole("button", { name: "Eliminar la foto 2" }));
    expect(deleteAction).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirmar eliminación de la foto 2" }));
    expect(deleteAction).toHaveBeenCalledWith("b");
  });

  it("uploads each valid file and reports the invalid ones", async () => {
    const { uploadAction } = setup();
    // Let the invalid file through the input's accept filter to test our own validation.
    const user = userEvent.setup({ applyAccept: false });
    const valid1 = new File(["1"], "living.jpg", { type: "image/jpeg" });
    const valid2 = new File(["2"], "cocina.png", { type: "image/png" });
    const invalid = new File(["3"], "plano.pdf", { type: "application/pdf" });

    await user.upload(screen.getByLabelText(/Agregar fotos/), [valid1, invalid, valid2]);

    await waitFor(() => expect(uploadAction).toHaveBeenCalledTimes(2));
    expect(uploadAction.mock.calls[0][0].get("file")).toBe(valid1);
    expect(uploadAction.mock.calls[1][0].get("file")).toBe(valid2);
    expect(await screen.findByRole("alert")).toHaveTextContent("plano.pdf");
  });

  it("disables uploads at the 30-photo limit", () => {
    setup(Array.from({ length: 30 }, (_, i) => image(String.fromCharCode(97 + (i % 26)) + i)));

    expect(screen.getByLabelText(/Agregar fotos/)).toBeDisabled();
  });

  it("has a drag handle on every photo", () => {
    setup();

    expect(screen.getByRole("button", { name: "Arrastrar la foto 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Arrastrar la foto 3" })).toBeInTheDocument();
  });

  it("saves the new order when a photo is dropped on another", async () => {
    const { reorderAction } = setup();

    act(() => {
      dnd.onDragEnd?.({ active: { id: "c" }, over: { id: "a" } });
    });

    expect(photoIds()).toEqual(["c", "a", "b"]);
    await waitFor(() => expect(reorderAction).toHaveBeenCalledWith(["c", "a", "b"]));
  });

  it("ignores a drop outside any photo", () => {
    const { reorderAction } = setup();

    act(() => {
      dnd.onDragEnd?.({ active: { id: "c" }, over: null });
    });

    expect(reorderAction).not.toHaveBeenCalled();
  });
});

describe("PropertyImagesManager uploads", () => {
  function stubObjectUrls() {
    let counter = 0;
    const revoke = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, {
      createObjectURL: vi.fn(() => `blob:preview-${++counter}`),
      revokeObjectURL: revoke,
    }));
    return revoke;
  }

  function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => {
      resolve = r;
    });
    return { promise, resolve };
  }

  it("shows a thumbnail with a status for each file while it uploads, then removes it", async () => {
    const revoke = stubObjectUrls();
    const upload = deferred<ActionFeedback>();
    const { user, uploadAction } = setup([]);
    uploadAction.mockReturnValue(upload.promise);
    const file = new File(["1"], "living.jpg", { type: "image/jpeg" });

    await user.upload(screen.getByLabelText(/Agregar fotos/), file);

    const preview = await screen.findByAltText("Vista previa de living.jpg");
    expect(preview).toHaveAttribute("src", "blob:preview-1");
    expect(screen.getByText("Subiendo…", { selector: "span" })).toBeInTheDocument();

    await act(async () => {
      upload.resolve({});
    });

    await waitFor(() =>
      expect(screen.queryByAltText("Vista previa de living.jpg")).toBeNull(),
    );
    expect(revoke).toHaveBeenCalledWith("blob:preview-1");
  });

  it("compresses each photo before uploading it and shows the optimizing state", async () => {
    stubObjectUrls();
    const compression = deferred<File>();
    compressImage.mockReturnValue(compression.promise);
    const { user, uploadAction } = setup([]);
    const original = new File(["big"], "cocina.jpg", { type: "image/jpeg" });
    const small = new File(["s"], "cocina.webp", { type: "image/webp" });

    await user.upload(screen.getByLabelText(/Agregar fotos/), original);

    expect(await screen.findByText("Optimizando…", { selector: "span" })).toBeInTheDocument();
    expect(uploadAction).not.toHaveBeenCalled();

    await act(async () => {
      compression.resolve(small);
    });

    await waitFor(() => expect(uploadAction).toHaveBeenCalledTimes(1));
    expect(uploadAction.mock.calls[0][0].get("file")).toBe(small);
  });

  it("does not upload a photo that is still over 15 MB after compression and says so", async () => {
    stubObjectUrls();
    const huge = new File(["h"], "gigante.jpg", { type: "image/jpeg" });
    Object.defineProperty(huge, "size", { value: MAX_IMAGE_BYTES + 1 });
    compressImage.mockResolvedValue(huge);
    const { user, uploadAction } = setup([]);

    await user.upload(screen.getByLabelText(/Agregar fotos/), huge);

    expect(await screen.findByText(/La foto supera los 15 MB/)).toBeInTheDocument();
    expect(uploadAction).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Descartar gigante.jpg" }));
    expect(screen.queryByAltText("Vista previa de gigante.jpg")).toBeNull();
  });

  it("keeps a failed upload visible with its error until discarded", async () => {
    stubObjectUrls();
    const { user, uploadAction } = setup([]);
    uploadAction.mockResolvedValue({ error: "El archivo no es una imagen válida." });
    const file = new File(["1"], "roto.jpg", { type: "image/jpeg" });

    await user.upload(screen.getByLabelText(/Agregar fotos/), file);

    expect(await screen.findByText(/El archivo no es una imagen válida/)).toBeInTheDocument();
    expect(screen.getByAltText("Vista previa de roto.jpg")).toBeInTheDocument();
  });

  it("accepts a big original (it will be compressed) instead of rejecting it at 15 MB", async () => {
    stubObjectUrls();
    const { user, uploadAction } = setup([]);
    const big = new File(["b"], "pesada.jpg", { type: "image/jpeg" });
    Object.defineProperty(big, "size", { value: 20 * 1024 * 1024 });
    compressImage.mockResolvedValue(new File(["c"], "pesada.webp", { type: "image/webp" }));

    await user.upload(screen.getByLabelText(/Agregar fotos/), big);

    await waitFor(() => expect(uploadAction).toHaveBeenCalledTimes(1));
    expect(compressImage).toHaveBeenCalledWith(big);
  });
});
