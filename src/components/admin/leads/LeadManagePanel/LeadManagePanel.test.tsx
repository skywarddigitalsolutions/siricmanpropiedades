import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import LeadManagePanel from "./LeadManagePanel";

type UpdateAction = (prev: ActionFeedback, formData: FormData) => Promise<ActionFeedback>;
type DeleteAction = () => Promise<ActionFeedback>;

// jsdom has no modal <dialog> API: emulate the bit the panel relies on.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

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

describe("LeadManagePanel status control", () => {
  it("is a 3-option radio group with the current status selected", () => {
    setup({ status: "contacted" });

    const group = screen.getByRole("radiogroup", { name: "Estado" });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "Nueva" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Contactada" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Cerrada" })).not.toBeChecked();
  });

  it("saves instantly when another option is picked (no save button for the status)", async () => {
    const { user, updateAction } = setup();

    await user.click(screen.getByRole("radio", { name: "Cerrada" }));

    expect(updateAction).toHaveBeenCalledTimes(1);
    const formData = updateAction.mock.calls[0][1];
    expect(formData.get("status")).toBe("closed");
    expect(formData.has("notes")).toBe(false);
    expect(await screen.findByRole("status")).toHaveTextContent("Estado actualizado.");
  });

  it("does not call the API when the current option is picked again", async () => {
    const { user, updateAction } = setup({ status: "contacted" });

    await user.click(screen.getByRole("radio", { name: "Contactada" }));

    expect(updateAction).not.toHaveBeenCalled();
  });

  it("selects the new option right away while saving", async () => {
    let finish: (feedback: ActionFeedback) => void = () => {};
    const pending = new Promise<ActionFeedback>((resolve) => {
      finish = resolve;
    });
    const { user } = setup({ updateAction: vi.fn<UpdateAction>(() => pending) });

    await user.click(screen.getByRole("radio", { name: "Contactada" }));

    expect(screen.getByRole("radio", { name: "Contactada" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Nueva" })).not.toBeChecked();
    finish({ message: "ok" });
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
  });

  it("rolls back to the saved status and shows the error when saving fails", async () => {
    const { user } = setup({
      updateAction: vi.fn<UpdateAction>(async () => ({ error: "No se pudo guardar." })),
    });

    await user.click(screen.getByRole("radio", { name: "Cerrada" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo guardar.");
    await waitFor(() => expect(screen.getByRole("radio", { name: "Nueva" })).toBeChecked());
    expect(screen.getByRole("radio", { name: "Cerrada" })).not.toBeChecked();
  });

  it("follows the status the server sends after a refresh", () => {
    const props = {
      notes: null,
      canDelete: false,
      updateAction: vi.fn<UpdateAction>(),
      deleteAction: vi.fn<DeleteAction>(),
    };
    const { rerender } = render(<LeadManagePanel status="new" {...props} />);

    rerender(<LeadManagePanel status="contacted" {...props} />);

    expect(screen.getByRole("radio", { name: "Contactada" })).toBeChecked();
  });
});

describe("LeadManagePanel notes", () => {
  it("saves the notes together with the current status", async () => {
    const { user, updateAction } = setup({ status: "contacted", notes: "Llamar el lunes" });

    expect(screen.getByLabelText("Notas internas")).toHaveValue("Llamar el lunes");
    await user.type(screen.getByLabelText("Notas internas"), " a la tarde");
    await user.click(screen.getByRole("button", { name: "Guardar notas" }));

    const formData = updateAction.mock.calls[0][1];
    expect(formData.get("status")).toBe("contacted");
    expect(formData.get("notes")).toBe("Llamar el lunes a la tarde");
    expect(await screen.findByText("Cambios guardados.")).toBeInTheDocument();
  });

  it("shows note errors as alerts", async () => {
    const { user, updateAction } = setup({ status: "contacted" });
    updateAction.mockResolvedValue({ error: "No se pudo guardar." });

    await user.click(screen.getByRole("button", { name: "Guardar notas" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo guardar.");
  });
});

describe("LeadManagePanel status colors", () => {
  it("marks each option with its status so the selected one is colored per status", () => {
    setup({ status: "contacted" });

    expect(screen.getByRole("radio", { name: "Nueva" })).toHaveAttribute("data-status", "new");
    expect(screen.getByRole("radio", { name: "Contactada" })).toHaveAttribute(
      "data-status",
      "contacted",
    );
    expect(screen.getByRole("radio", { name: "Cerrada" })).toHaveAttribute("data-status", "closed");
  });

  it("keeps keyboard selection with the arrow keys", async () => {
    const { user, updateAction } = setup({ status: "new" });

    await user.tab();
    expect(screen.getByRole("radio", { name: "Nueva" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");

    expect(updateAction).toHaveBeenCalledTimes(1);
    expect(updateAction.mock.calls[0][1].get("status")).toBe("contacted");
  });
});

describe("LeadManagePanel delete", () => {
  it("offers a danger button with the trash icon that opens a confirmation dialog", async () => {
    const { user, deleteAction } = setup({ canDelete: true });

    expect(screen.queryByRole("dialog")).toBeNull();
    const trigger = screen.getByRole("button", { name: "Eliminar consulta" });
    expect(trigger.querySelector("svg")).not.toBeNull();
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "¿Eliminar esta consulta?" });
    expect(dialog).toHaveTextContent("Se borra definitivamente y no se puede recuperar.");
    expect(deleteAction).not.toHaveBeenCalled();
  });

  it("closes without deleting on Cancelar", async () => {
    const { user, deleteAction } = setup({ canDelete: true });

    await user.click(screen.getByRole("button", { name: "Eliminar consulta" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(deleteAction).not.toHaveBeenCalled();
  });

  it("deletes only from the confirmation button", async () => {
    const { user, deleteAction } = setup({ canDelete: true });

    await user.click(screen.getByRole("button", { name: "Eliminar consulta" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    expect(deleteAction).toHaveBeenCalledTimes(1);
  });

  it("shows a delete error inside the dialog", async () => {
    const { user } = setup({
      canDelete: true,
      deleteAction: vi.fn<DeleteAction>(async () => ({ error: "No se pudo eliminar." })),
    });

    await user.click(screen.getByRole("button", { name: "Eliminar consulta" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo eliminar.");
  });

  it("hides delete from managers", () => {
    setup({ canDelete: false });

    expect(screen.queryByRole("button", { name: "Eliminar consulta" })).toBeNull();
  });
});
