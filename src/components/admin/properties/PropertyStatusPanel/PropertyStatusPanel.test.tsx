import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import { computeReadiness } from "@/lib/properties/readiness";
import PropertyStatusPanel from "./PropertyStatusPanel";

const READY = computeReadiness({
  imageCount: 2,
  description: "x".repeat(60),
  price: 1000,
});
const NOT_READY = computeReadiness({
  imageCount: 0,
  description: "",
  price: 1000,
});

type Action = (prev: ActionFeedback, formData: FormData) => Promise<ActionFeedback>;

afterEach(() => cleanup());

type PanelProps = Parameters<typeof PropertyStatusPanel>[0];

function renderPanel(overrides: Partial<PanelProps> = {}) {
  const props = {
    propertyId: "p1",
    readiness: READY,
    publicationStatus: "draft" as const,
    dealStatus: "available" as const,
    operation: "sale" as const,
    canDelete: false,
    showArchiveHint: false,
    publicationAction: vi.fn<Action>(async () => ({})),
    dealStatusAction: vi.fn<Action>(async () => ({})),
    deleteAction: vi.fn<Action>(async () => ({})),
  };
  render(<PropertyStatusPanel {...props} {...overrides} />);
  return props;
}

describe("PropertyStatusPanel", () => {
  it("offers the transitions of the current status and sends the chosen one", async () => {
    const user = userEvent.setup();
    const publicationAction = vi.fn<Action>(async () => ({
      message: "Propiedad publicada.",
    }));
    renderPanel({ publicationAction });

    const publication = screen.getByRole("group", { name: "Publicación" });
    expect(within(publication).getByRole("button", { name: "Publicar" })).toBeInTheDocument();
    expect(within(publication).getByRole("button", { name: "Archivar" })).toBeInTheDocument();
    expect(within(publication).queryByRole("button", { name: "Pasar a borrador" })).toBeNull();

    await user.click(within(publication).getByRole("button", { name: "Publicar" }));

    const [, formData] = publicationAction.mock.calls[0];
    expect(formData.get("transition")).toBe("publish");
    expect(await screen.findByRole("status")).toHaveTextContent("Propiedad publicada.");
  });

  it("limits the deal statuses to the operation and submits the choice", async () => {
    const user = userEvent.setup();
    const props = renderPanel({ operation: "rent" });

    const select = screen.getByLabelText("Estado comercial");
    expect(within(select).queryByRole("option", { name: "Vendida" })).toBeNull();
    expect(within(select).getByRole("option", { name: "Alquilada" })).toBeInTheDocument();

    await user.selectOptions(select, "rented");
    await user.click(screen.getByRole("button", { name: "Actualizar estado" }));

    const [, formData] = props.dealStatusAction.mock.calls[0];
    expect(formData.get("dealStatus")).toBe("rented");
  });

  it("shows action errors as alerts", async () => {
    const user = userEvent.setup();
    renderPanel({
      dealStatusAction: vi.fn<Action>(async () => ({
        error: "La propiedad ya tiene ese estado comercial.",
      })),
    });

    await user.click(screen.getByRole("button", { name: "Actualizar estado" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La propiedad ya tiene ese estado comercial.",
    );
  });

  it("asks for confirmation before deleting", async () => {
    const user = userEvent.setup();
    const props = renderPanel({ canDelete: true });

    await user.click(screen.getByText("Eliminar propiedad"));
    await user.click(screen.getByRole("button", { name: "Sí, eliminar definitivamente" }));

    expect(props.deleteAction).toHaveBeenCalled();
  });

  it("hides delete when not allowed and explains archiving for published properties", () => {
    renderPanel({ canDelete: false, showArchiveHint: true });

    expect(screen.queryByText("Eliminar propiedad")).toBeNull();
    expect(screen.getByText(/ya fue publicada/)).toBeInTheDocument();
  });

  it("blocks Publicar with the checklist while the property is not ready", () => {
    renderPanel({ readiness: NOT_READY });

    const publish = screen.getByRole("button", { name: "Publicar" });
    expect(publish).toBeDisabled();
    expect(publish).toHaveAccessibleDescription(/Falta: Al menos una foto/);
    expect(screen.getByText("Al menos una foto")).toBeInTheDocument();
    // Archivar stays available.
    expect(screen.getByRole("button", { name: "Archivar" })).toBeEnabled();
  });

  it("enables Publicar when the checklist is complete", () => {
    renderPanel({ readiness: READY });

    expect(screen.getByRole("button", { name: "Publicar" })).toBeEnabled();
    expect(screen.getByText("Lista para publicar")).toBeInTheDocument();
  });

  it("does not gate unpublishing a published property", () => {
    renderPanel({ publicationStatus: "published", readiness: NOT_READY });

    expect(screen.getByRole("button", { name: "Pasar a borrador" })).toBeEnabled();
  });
});
