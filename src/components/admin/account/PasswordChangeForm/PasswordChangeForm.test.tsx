import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PasswordFormState } from "@/lib/account/password-change";
import PasswordChangeForm from "./PasswordChangeForm";

afterEach(cleanup);

async function fill(user: ReturnType<typeof userEvent.setup>, values: Partial<Record<string, string>> = {}) {
  const all = {
    "Contraseña actual": "Actual1",
    "Nueva contraseña": "Nueva123",
    "Repetir nueva contraseña": "Nueva123",
    "Código de verificación": "123456",
    ...values,
  };
  for (const [label, value] of Object.entries(all)) {
    if (value) await user.type(screen.getByLabelText(label), value);
  }
}

describe("PasswordChangeForm", () => {
  it("shows the four fields, the policy hint and the submit button", () => {
    render(<PasswordChangeForm action={vi.fn()} />);

    for (const label of [
      "Contraseña actual",
      "Nueva contraseña",
      "Repetir nueva contraseña",
      "Código de verificación",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(
      screen.getByText("De 6 a 50 caracteres, con mayúscula, minúscula y número."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cambiar contraseña" })).toBeInTheDocument();
  });

  it("checks the confirmation on the client and does not call the action", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    render(<PasswordChangeForm action={action} />);

    await fill(user, { "Repetir nueva contraseña": "Otra1234" });
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(screen.getByText("Las contraseñas no coinciden.")).toBeInTheDocument();
    expect(screen.getByLabelText("Repetir nueva contraseña")).toHaveAttribute("aria-invalid", "true");
    expect(action).not.toHaveBeenCalled();
  });

  it("submits the form data to the action when valid", async () => {
    const action = vi.fn(async (): Promise<PasswordFormState> => ({}));
    const user = userEvent.setup();
    render(<PasswordChangeForm action={action} />);

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = (action.mock.calls[0] as unknown as [PasswordFormState, FormData])[1];
    expect(formData.get("currentPassword")).toBe("Actual1");
    expect(formData.get("newPassword")).toBe("Nueva123");
    expect(formData.get("confirmPassword")).toBe("Nueva123");
    expect(formData.get("code")).toBe("123456");
  });

  it("shows the success notice returned by the action", async () => {
    const action = vi.fn(
      async (): Promise<PasswordFormState> => ({
        message: "Tu contraseña se actualizó. Se cerraron tus otras sesiones.",
      }),
    );
    const user = userEvent.setup();
    render(<PasswordChangeForm action={action} />);

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Tu contraseña se actualizó. Se cerraron tus otras sesiones.",
    );
  });

  it("shows field errors and a form-level alert from the server", async () => {
    const action = vi.fn(
      async (): Promise<PasswordFormState> => ({
        fieldErrors: { currentPassword: "La contraseña actual no es correcta." },
        error: "Demasiados intentos. Esperá unos minutos.",
      }),
    );
    const user = userEvent.setup();
    render(<PasswordChangeForm action={action} />);

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(await screen.findByText("La contraseña actual no es correcta.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Demasiados intentos");
  });
});
