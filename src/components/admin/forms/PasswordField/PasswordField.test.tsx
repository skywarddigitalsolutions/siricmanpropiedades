import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PasswordField from "./PasswordField";

afterEach(() => cleanup());

describe("PasswordField", () => {
  it("hides the password by default and reveals it with an accessible toggle", async () => {
    const user = userEvent.setup();
    render(<PasswordField id="password" name="password" label="Contraseña" />);

    const input = screen.getByLabelText("Contraseña");
    expect(input).toHaveAttribute("type", "password");

    const toggle = screen.getByRole("button", { name: "Mostrar contraseña" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("type", "button");

    await user.click(toggle);

    expect(input).toHaveAttribute("type", "text");
    const pressed = screen.getByRole("button", { name: "Ocultar contraseña" });
    expect(pressed).toHaveAttribute("aria-pressed", "true");

    await user.click(pressed);
    expect(input).toHaveAttribute("type", "password");
  });

  it("forwards input props and shows the error", () => {
    render(
      <PasswordField
        id="password"
        name="password"
        label="Contraseña"
        autoComplete="current-password"
        error="Requerida"
        required
      />,
    );

    const input = screen.getByLabelText("Contraseña");
    expect(input).toHaveAttribute("autocomplete", "current-password");
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Requerida")).toBeInTheDocument();
  });
});
