import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PropertyImage } from "@/lib/api/properties";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import PropertyImagesManager from "./PropertyImagesManager";

afterEach(() => cleanup());

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
});
