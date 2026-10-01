import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import LeadManagePanel from "./LeadManagePanel";

type UpdateAction = (prev: ActionFeedback, formData: FormData) => Promise<ActionFeedback>;
type DeleteAction = () => Promise<ActionFeedback>;

afterEach(() => cleanup());

function setup(overrides: Partial<Parameters<typeof LeadManagePanel>[0]> = {}) {
  const updateAction = vi.fn<UpdateAction>(async () => ({ message: "Cambios guardados." }));
  const deleteAction = vi.fn<DeleteAction>(async () => ({}));
  render(
    <LeadManagePanel
      status="new"
      notes={null}
      canDelete={false}
      updateAction={updateAction}
      deleteAction={deleteAction}
      {...overrides}
    />,
  );
  return { user: userEvent.setup(), updateAction, deleteAction };
}

describe("LeadManagePanel", () => {
  it("marks a new lead as contacted in one tap", async () => {
    const { user, updateAction } = setup();

    await user.click(screen.getByRole("button", { name: "Marcar como contactada" }));

    const formData = updateAction.mock.calls[0][1];
    expect(formData.get("status")).toBe("contacted");
    expect(formData.has("notes")).toBe(false);
    expect(await screen.findByRole("status")).toHaveTextContent("Cambios guardados.");
  });

  it("keeps the confirmation after the page refreshes with the new status", async () => {
    const updateAction = vi.fn<UpdateAction>(async () => ({ message: "Cambios guardados." }));
    const deleteAction = vi.fn<DeleteAction>(async () => ({}));
    const props = { notes: null, canDelete: false, updateAction, deleteAction };
    const { rerender } = render(<LeadManagePanel status="new" {...props} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Marcar como contactada" }));
    await screen.findByRole("status");
    // The action revalidates the page: the lead now arrives as contacted.
    rerender(<LeadManagePanel status="contacted" {...props} />);

    expect(screen.queryByRole("button", { name: "Marcar como contactada" })).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Cambios guardados.");
  });

  it("hides the one-tap action once the lead is no longer new", () => {
    setup({ status: "contacted" });

    expect(screen.queryByRole("button", { name: "Marcar como contactada" })).toBeNull();
  });

  it("saves the status and notes together", async () => {
    const { user, updateAction } = setup({ status: "contacted", notes: "Llamar el lunes" });

    expect(screen.getByLabelText("Notas internas")).toHaveValue("Llamar el lunes");
    await user.selectOptions(screen.getByLabelText("Estado"), "closed");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    const formData = updateAction.mock.calls[0][1];
    expect(formData.get("status")).toBe("closed");
    expect(formData.get("notes")).toBe("Llamar el lunes");
  });

  it("shows errors as alerts", async () => {
    const { user, updateAction } = setup({ status: "contacted" });
    updateAction.mockResolvedValue({ error: "No se pudo guardar." });

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo guardar.");
  });

  it("lets admins delete after confirming", async () => {
    const { user, deleteAction } = setup({ canDelete: true });

    await user.click(screen.getByText("Eliminar consulta"));
    await user.click(screen.getByRole("button", { name: "Sí, eliminar definitivamente" }));

    expect(deleteAction).toHaveBeenCalled();
  });

  it("hides delete from managers", () => {
    setup({ canDelete: false });

    expect(screen.queryByText("Eliminar consulta")).toBeNull();
  });
});
