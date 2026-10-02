import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewUserPanel from "./NewUserPanel";

afterEach(cleanup);

const roles = [
  { id: "r1", name: "manager" },
  { id: "r2", name: "user" },
];

describe("NewUserPanel", () => {
  it("starts closed and opens the form from the Nuevo usuario button", async () => {
    const user = userEvent.setup();
    render(<NewUserPanel roles={roles} action={vi.fn()} />);

    expect(screen.queryByLabelText("Usuario")).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Nuevo usuario" });
    expect(toggle.querySelector("svg")).not.toBeNull();

    await user.click(toggle);

    expect(screen.getByLabelText("Usuario")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByText("De 6 a 50 caracteres, con mayúscula, minúscula y número.")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Gerente" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Usuario" })).toBeInTheDocument();
  });

  it("submits user, password and role id", async () => {
    const action = vi.fn(async () => ({}));
    const user = userEvent.setup();
    render(<NewUserPanel roles={roles} action={action} />);

    await user.click(screen.getByRole("button", { name: "Nuevo usuario" }));
    await user.type(screen.getByLabelText("Usuario"), "ana");
    await user.type(screen.getByLabelText("Contraseña"), "Abcde1");
    await user.selectOptions(screen.getByLabelText("Rol"), "r2");
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = (action.mock.calls[0] as unknown as [unknown, FormData])[1];
    expect(formData.get("userName")).toBe("ana");
    expect(formData.get("password")).toBe("Abcde1");
    expect(formData.get("roleId")).toBe("r2");
  });

  it("shows field errors", async () => {
    const action = vi.fn(async () => ({ fieldErrors: { userName: "Ese usuario ya existe." } }));
    const user = userEvent.setup();
    render(<NewUserPanel roles={roles} action={action} />);

    await user.click(screen.getByRole("button", { name: "Nuevo usuario" }));
    await user.type(screen.getByLabelText("Usuario"), "ana");
    await user.type(screen.getByLabelText("Contraseña"), "Abcde1");
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(await screen.findByText("Ese usuario ya existe.")).toBeInTheDocument();
  });
});
