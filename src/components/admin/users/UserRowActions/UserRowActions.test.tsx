import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserRowActions from "./UserRowActions";

afterEach(cleanup);

const ok = () => vi.fn(async () => ({ message: "Hecho." }));

function setup(overrides: Partial<React.ComponentProps<typeof UserRowActions>> = {}) {
  const props = {
    userName: "ana",
    isActive: true,
    isSelf: false,
    toggleAction: ok(),
    resetAction: ok(),
    ...overrides,
  };
  render(<UserRowActions {...props} />);
  return props;
}

describe("UserRowActions", () => {
  it("asks for confirmation before deactivating", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: "Desactivar" }));
    expect(props.toggleAction).not.toHaveBeenCalled();
    expect(screen.getByText("¿Desactivar a ana? No va a poder ingresar.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sí, desactivar" }));
    await waitFor(() => expect(props.toggleAction).toHaveBeenCalledTimes(1));
  });

  it("can cancel the confirmation", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: "Desactivar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("button", { name: "Sí, desactivar" })).not.toBeInTheDocument();
    expect(props.toggleAction).not.toHaveBeenCalled();
  });

  it("offers Activar for inactive users, with confirmation", async () => {
    const user = userEvent.setup();
    const props = setup({ isActive: false });

    await user.click(screen.getByRole("button", { name: "Activar" }));
    await user.click(screen.getByRole("button", { name: "Sí, activar" }));
    await waitFor(() => expect(props.toggleAction).toHaveBeenCalledTimes(1));
  });

  it("disables deactivating yourself", () => {
    setup({ isSelf: true });

    const button = screen.getByRole("button", { name: "Desactivar" });
    expect(button).toBeDisabled();
    expect(screen.getByText("No podés desactivar tu propia cuenta.")).toBeInTheDocument();
  });

  it("resets the password through an inline form that warns about sessions", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: "Blanquear contraseña" }));
    expect(screen.getByText(/cierra las sesiones de este usuario/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nueva contraseña"), "Nueva123");
    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    await waitFor(() => expect(props.resetAction).toHaveBeenCalledTimes(1));
    const formData = ((props.resetAction as ReturnType<typeof ok>).mock.calls[0] as unknown as [unknown, FormData])[1];
    expect(formData.get("newPassword")).toBe("Nueva123");
  });

  it("shows server messages", async () => {
    const user = userEvent.setup();
    setup({ resetAction: vi.fn(async () => ({ error: "No pudimos blanquear." })) });

    await user.click(screen.getByRole("button", { name: "Blanquear contraseña" }));
    await user.type(screen.getByLabelText("Nueva contraseña"), "Nueva123");
    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos blanquear.");
  });
});
