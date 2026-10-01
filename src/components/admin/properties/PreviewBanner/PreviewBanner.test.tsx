import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { computeReadiness } from "@/lib/properties/readiness";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import PreviewBanner from "./PreviewBanner";

afterEach(() => cleanup());

const READY = computeReadiness({ imageCount: 1, description: "x".repeat(60), price: 10 });
const NOT_READY = computeReadiness({ imageCount: 0, description: "", price: 10 });

type Action = (prev: ActionFeedback, formData: FormData) => Promise<ActionFeedback>;

function renderBanner(overrides: Partial<Parameters<typeof PreviewBanner>[0]> = {}) {
  const action = vi.fn<Action>(async () => ({ message: "Propiedad publicada." }));
  render(
    <PreviewBanner
      propertyId="p1"
      publicationStatus="draft"
      readiness={READY}
      publicationAction={action}
      siteHref="/propiedades/casa"
      {...overrides}
    />,
  );
  return action;
}

describe("PreviewBanner", () => {
  it("says what the page is and links back to editing", () => {
    renderBanner();

    expect(screen.getByText("Vista previa — así la verán tus clientes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a editar" })).toHaveAttribute(
      "href",
      "/admin/propiedades/p1?paso=datos",
    );
  });

  it("publishes with the publish transition when ready", async () => {
    const user = userEvent.setup();
    const action = renderBanner();

    await user.click(screen.getByRole("button", { name: "Publicar" }));

    expect(action.mock.calls[0][1].get("transition")).toBe("publish");
    expect(await screen.findByRole("status")).toHaveTextContent("Propiedad publicada.");
  });

  it("disables Publicar and explains what is missing when not ready", () => {
    renderBanner({ readiness: NOT_READY });

    const publish = screen.getByRole("button", { name: "Publicar" });
    expect(publish).toBeDisabled();
    expect(publish).toHaveAccessibleDescription(/Falta: Al menos una foto/);
    expect(screen.getByText(/Todavía no se puede publicar/)).toBeInTheDocument();
  });

  it("shows the live state and a link to the site for a published property", () => {
    renderBanner({ publicationStatus: "published" });

    expect(screen.queryByRole("button", { name: "Publicar" })).toBeNull();
    expect(screen.getByText("Ya está publicada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver en el sitio" })).toHaveAttribute(
      "href",
      "/propiedades/casa",
    );
  });
});
