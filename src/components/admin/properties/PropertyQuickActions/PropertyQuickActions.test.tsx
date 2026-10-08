import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import PropertyQuickActions from "./PropertyQuickActions";

afterEach(() => {
  cleanup();
});

describe("PropertyQuickActions", () => {
  it("publishes a draft with the property id and the publish transition", async () => {
    const action = vi.fn().mockResolvedValue({ message: "Propiedad publicada." });
    render(
      <PropertyQuickActions
        id="p1"
        title="Casa"
        publicationStatus="draft"
        action={action}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Publicar Casa" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const [id, , formData] = action.mock.calls[0];
    expect(id).toBe("p1");
    expect(formData.get("transition")).toBe("publish");
  });

  it("renders icon-only buttons with a tooltip", () => {
    const { rerender } = render(
      <PropertyQuickActions id="p1" title="Casa" publicationStatus="draft" action={vi.fn()} />,
    );
    const publish = screen.getByRole("button", { name: "Publicar Casa" });
    expect(publish).toHaveAttribute("data-tooltip", "Publicar");
    expect(publish.querySelector("svg")).not.toBeNull();
    expect(publish).toHaveTextContent("");

    rerender(
      <PropertyQuickActions id="p1" title="Casa" publicationStatus="published" action={vi.fn()} />,
    );
    const withdraw = screen.getByRole("button", { name: "Retirar Casa" });
    expect(withdraw).toHaveAttribute("data-tooltip", "Retirar");
    expect(withdraw.querySelector("svg")).not.toBeNull();
  });

  it("explains in the tooltip why Publicar is blocked", () => {
    render(
      <PropertyQuickActions
        id="p1"
        title="Casa"
        publicationStatus="draft"
        action={vi.fn()}
        publishBlockedReason="Agregá al menos una foto para publicar."
      />,
    );

    const publish = screen.getByRole("button", { name: "Publicar Casa" });
    expect(publish).toBeDisabled();
    expect(publish).toHaveAttribute("data-tooltip", "Agregá al menos una foto para publicar.");
  });

  it("withdraws a published property with the unpublish transition", async () => {
    const action = vi.fn().mockResolvedValue({ message: "ok" });
    render(
      <PropertyQuickActions
        id="p1"
        title="Casa"
        publicationStatus="published"
        action={action}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Retirar Casa" }));

    await waitFor(() => expect(action).toHaveBeenCalled());
    expect(action.mock.calls[0][2].get("transition")).toBe("unpublish");
  });

  it("shows the action error inline", async () => {
    const action = vi.fn().mockResolvedValue({ error: "El estado cambió." });
    render(
      <PropertyQuickActions
        id="p1"
        title="Casa"
        publicationStatus="draft"
        action={action}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Publicar Casa" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El estado cambió.");
  });

  it("renders nothing for archived properties", () => {
    const { container } = render(
      <PropertyQuickActions
        id="p1"
        title="Casa"
        publicationStatus="archived"
        action={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
