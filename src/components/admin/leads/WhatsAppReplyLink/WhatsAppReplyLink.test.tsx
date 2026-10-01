import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import WhatsAppReplyLink from "./WhatsAppReplyLink";

type UpdateAction = (prev: ActionFeedback, formData: FormData) => Promise<ActionFeedback>;

const HREF = "https://wa.me/5491138967363?text=Hola";

// The link opens a new tab; jsdom cannot navigate, so swallow the default.
const swallowNavigation = (event: Event) => event.preventDefault();
beforeEach(() => document.addEventListener("click", swallowNavigation));
afterEach(() => {
  document.removeEventListener("click", swallowNavigation);
  cleanup();
});

function setup(status: "new" | "contacted" | "closed") {
  const updateAction = vi.fn<UpdateAction>(async () => ({ message: "Cambios guardados." }));
  render(<WhatsAppReplyLink status={status} href={HREF} updateAction={updateAction} />);
  return { user: userEvent.setup(), updateAction };
}

describe("WhatsAppReplyLink", () => {
  it("is a primary link that opens the prefilled chat in a new tab", () => {
    setup("new");

    const link = screen.getByRole("link", { name: "Responder por WhatsApp" });
    expect(link).toHaveAttribute("href", HREF);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("marks a new lead as contacted when opening the chat", async () => {
    const { user, updateAction } = setup("new");

    await user.click(screen.getByRole("link", { name: "Responder por WhatsApp" }));

    expect(updateAction).toHaveBeenCalledTimes(1);
    expect(updateAction.mock.calls[0][1].get("status")).toBe("contacted");
  });

  it.each(["contacted", "closed"] as const)("leaves a %s lead untouched", async (status) => {
    const { user, updateAction } = setup(status);

    await user.click(screen.getByRole("link", { name: "Responder por WhatsApp" }));

    expect(updateAction).not.toHaveBeenCalled();
  });

  it("shows the error when marking as contacted fails", async () => {
    const { user, updateAction } = setup("new");
    updateAction.mockResolvedValue({ error: "No se pudo guardar." });

    await user.click(screen.getByRole("link", { name: "Responder por WhatsApp" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo guardar.");
  });
});
