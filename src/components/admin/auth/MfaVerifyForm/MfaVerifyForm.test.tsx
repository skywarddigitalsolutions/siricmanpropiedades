import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormState } from "@/app/admin/(auth)/mfa/actions";
import MfaVerifyForm from "./MfaVerifyForm";

afterEach(() => {
  cleanup();
});

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

describe("MfaVerifyForm", () => {
  it("renders a free-text code field with the one-time-code autocomplete hint", () => {
    const action: Action = vi.fn(async () => ({}));
    render(<MfaVerifyForm action={action} />);

    const codeField = screen.getByLabelText("Código de verificación");
    expect(codeField).toHaveAttribute("autocomplete", "one-time-code");
    expect(codeField).toHaveAttribute("type", "text");
  });

  it("accepts a 6-digit TOTP code without truncation", async () => {
    const action: Action = vi.fn(async () => ({}));
    const user = userEvent.setup();
    render(<MfaVerifyForm action={action} />);

    const codeField = screen.getByLabelText("Código de verificación");
    await user.type(codeField, "123456");

    expect(codeField).toHaveValue("123456");
  });

  it("accepts a longer alphanumeric backup code", async () => {
    const action: Action = vi.fn(async () => ({}));
    const user = userEvent.setup();
    render(<MfaVerifyForm action={action} />);

    const codeField = screen.getByLabelText("Código de verificación");
    await user.type(codeField, "ABCD1234EF");

    expect(codeField).toHaveValue("ABCD1234EF");
  });

  it("shows a role=alert error for a wrong code", async () => {
    const action: Action = vi.fn(async (): Promise<FormState> => ({
      error: "invalid-code",
    }));
    const user = userEvent.setup();
    render(<MfaVerifyForm action={action} />);

    await user.type(screen.getByLabelText("Código de verificación"), "000000");
    await user.click(screen.getByRole("button", { name: "Verificar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El código no es válido. Si el problema continúa, vuelva a iniciar sesión.",
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
    render(<MfaVerifyForm action={action} />);

    await user.type(screen.getByLabelText("Código de verificación"), "123456");
    const submitPromise = user.click(
      screen.getByRole("button", { name: "Verificar" }),
    );

    expect(
      await screen.findByRole("button", { name: /Verificando/ }),
    ).toBeDisabled();

    resolveAction({});
    await submitPromise;
  });
});
