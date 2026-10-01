import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import LeadQuickActions from "./LeadQuickActions";

type UpdateAction = (prev: ActionFeedback, formData: FormData) => Promise<ActionFeedback>;

const WHATSAPP = "https://wa.me/5491138967363?text=Hola";

// The WhatsApp link opens a new tab; jsdom cannot navigate, so swallow the default.
const swallowNavigation = (event: Event) => event.preventDefault();
beforeEach(() => document.addEventListener("click", swallowNavigation));
afterEach(() => {
  document.removeEventListener("click", swallowNavigation);
  cleanup();
});

function setup(overrides: Partial<Parameters<typeof LeadQuickActions>[0]> = {}) {
  const updateAction = vi.fn<UpdateAction>(async () => ({ message: "Cambios guardados." }));
  render(
    <LeadQuickActions
      status="new"
      whatsappHref={WHATSAPP}
      updateAction={updateAction}
      {...overrides}
    />,
  );
  return { user: userEvent.setup(), updateAction };
}

describe("LeadQuickActions", () => {
  it("opens WhatsApp in a new tab (a real link, so popup blockers stay quiet)", () => {
    setup();

    const link = screen.getByRole("link", { name: /WhatsApp/ });
    expect(link).toHaveAttribute("href", WHATSAPP);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("marks a new lead as contacted when answering by WhatsApp", async () => {
    const { user, updateAction } = setup();

    await user.click(screen.getByRole("link", { name: /WhatsApp/ }));

    expect(updateAction).toHaveBeenCalledTimes(1);
    expect(updateAction.mock.calls[0][1].get("status")).toBe("contacted");
  });

  it("does not touch the status when the lead was already answered", async () => {
    const { user, updateAction } = setup({ status: "contacted" });

    await user.click(screen.getByRole("link", { name: /WhatsApp/ }));

    expect(updateAction).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Marcar como contactada/ })).toBeNull();
  });

  it("marks as contacted with the icon button", async () => {
    const { user, updateAction } = setup({ whatsappHref: undefined });

    await user.click(screen.getByRole("button", { name: /Marcar como contactada/ }));

    expect(updateAction.mock.calls[0][1].get("status")).toBe("contacted");
    expect(screen.queryByRole("link", { name: /WhatsApp/ })).toBeNull();
  });

  it("shows the error when the update fails", async () => {
    const { user, updateAction } = setup();
    updateAction.mockResolvedValue({ error: "No se pudo guardar." });

    await user.click(screen.getByRole("button", { name: /Marcar como contactada/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo guardar.");
  });
});
