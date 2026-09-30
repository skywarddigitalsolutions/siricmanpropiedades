import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormState } from "@/app/admin/(auth)/login/actions";
import LoginForm from "./LoginForm";

afterEach(() => {
  cleanup();
});

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

describe("LoginForm", () => {
  it("renders labeled username and password fields with the right autocomplete hints", () => {
    const action: Action = vi.fn(async () => ({}));
    render(<LoginForm action={action} />);

    expect(screen.getByLabelText("Usuario")).toHaveAttribute(
      "autocomplete",
      "username",
    );
    const password = screen.getByLabelText("Contraseña");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(password).toHaveAttribute("type", "password");
  });

  it("shows the mapped error message with role=alert for the AuthErrorCode returned by the action", async () => {
    const action: Action = vi.fn(async (): Promise<FormState> => ({
      error: "throttled",
    }));
    const user = userEvent.setup();
    render(<LoginForm action={action} />);

    await user.type(screen.getByLabelText("Usuario"), "gabriel");
    await user.type(screen.getByLabelText("Contraseña"), "pw");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Demasiados intentos. Espere unos minutos e intente nuevamente.",
    );
  });

  it("disables the submit button while the action is pending", async () => {
    let resolveAction!: (state: FormState) => void;
    const action: Action = vi.fn(
      () =>
        new Promise<FormState>((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<LoginForm action={action} />);

    await user.type(screen.getByLabelText("Usuario"), "gabriel");
    await user.type(screen.getByLabelText("Contraseña"), "pw");
    const submitPromise = user.click(
      screen.getByRole("button", { name: "Ingresar" }),
    );

    expect(
      await screen.findByRole("button", { name: /Ingresando/ }),
    ).toBeDisabled();

    resolveAction({});
    await submitPromise;
  });

  it("never echoes a password-shaped value from the action's state back into the password field", async () => {
    const action: Action = vi.fn(async () => ({
      error: "invalid-credentials",
      fields: { userName: "gabriel" },
      // Simulates a hypothetical bug where a wider FormState leaks a password
      // back from the server. `LoginForm` must never read this.
      leakedPassword: "leaked-secret",
    })) as unknown as Action;
    const user = userEvent.setup();
    render(<LoginForm action={action} />);

    await user.type(screen.getByLabelText("Usuario"), "gabriel");
    await user.type(screen.getByLabelText("Contraseña"), "my-typed-password");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));
    await screen.findByRole("alert");

    expect(screen.getByLabelText("Contraseña")).not.toHaveValue(
      "leaked-secret",
    );
  });
});
