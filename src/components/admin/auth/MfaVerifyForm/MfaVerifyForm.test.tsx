import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormState } from "@/app/admin/(auth)/mfa/actions";
import MfaVerifyForm from "./MfaVerifyForm";

afterEach(() => {
  cleanup();
});

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const APP_LABEL = "Código de la app";
const BACKUP_LABEL = "Código de respaldo";

function setup(action: Action = vi.fn(async () => ({}))) {
  const user = userEvent.setup();
  render(<MfaVerifyForm action={action} />);
  return { user, action: action as ReturnType<typeof vi.fn> };
}

describe("MfaVerifyForm (app code mode)", () => {
  it("renders a numeric one-time-code field by default", () => {
    setup();

    const field = screen.getByLabelText(APP_LABEL);
    expect(field).toHaveAttribute("name", "code");
    expect(field).toHaveAttribute("inputmode", "numeric");
    expect(field).toHaveAttribute("autocomplete", "one-time-code");
    expect(field).toHaveAttribute("pattern", "[0-9]*");
  });

  it("drops non-digits as the user types", async () => {
    const { user } = setup();

    const field = screen.getByLabelText(APP_LABEL);
    await user.type(field, "1a2-b3");

    expect(field).toHaveValue("123");
  });

  it("strips spaces from a pasted code", async () => {
    const { user } = setup();

    const field = screen.getByLabelText(APP_LABEL);
    await user.click(field);
    await user.paste("123 456");

    expect(field).toHaveValue("123456");
  });

  it("caps the code at 6 digits", async () => {
    const { user } = setup();

    const field = screen.getByLabelText(APP_LABEL);
    await user.click(field);
    await user.paste("12345678");

    expect(field).toHaveValue("123456");
  });

  it("submits automatically on the 6th digit, once", async () => {
    const { user, action } = setup();

    await user.type(screen.getByLabelText(APP_LABEL), "123456");

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("code")).toBe("123456");

    // A re-render with the same value must not submit again.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("does not auto-submit before the 6th digit", async () => {
    const { user, action } = setup();

    await user.type(screen.getByLabelText(APP_LABEL), "12345");

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(action).not.toHaveBeenCalled();
  });

  it("keeps the submit button available", () => {
    setup();

    expect(screen.getByRole("button", { name: "Verificar" })).toBeEnabled();
  });

  it("shows a role=alert error for a wrong code", async () => {
    const action: Action = vi.fn(async (): Promise<FormState> => ({
      error: "invalid-code",
    }));
    const { user } = setup(action);

    await user.type(screen.getByLabelText(APP_LABEL), "000000");

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
    const { user } = setup(action);

    await user.type(screen.getByLabelText(APP_LABEL), "123456");

    expect(
      await screen.findByRole("button", { name: /Verificando/ }),
    ).toBeDisabled();

    resolveAction({});
  });
});

describe("MfaVerifyForm (backup code mode)", () => {
  it("switches to a text field that sends the same field name", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", { name: "Usar un código de respaldo" }),
    );

    const field = screen.getByLabelText(BACKUP_LABEL);
    expect(field).toHaveAttribute("name", "code");
    expect(field).toHaveAttribute("autocomplete", "off");
    expect(field).not.toHaveAttribute("inputmode", "numeric");
    expect(screen.queryByLabelText(APP_LABEL)).not.toBeInTheDocument();
  });

  it("accepts letters, lowercases them and caps at 10 characters", async () => {
    const { user } = setup();
    await user.click(
      screen.getByRole("button", { name: "Usar un código de respaldo" }),
    );

    const field = screen.getByLabelText(BACKUP_LABEL);
    await user.type(field, "ABCD1234EFGH");

    expect(field).toHaveValue("abcd1234ef");
  });

  it("strips separators from a pasted backup code", async () => {
    const { user } = setup();
    await user.click(
      screen.getByRole("button", { name: "Usar un código de respaldo" }),
    );

    const field = screen.getByLabelText(BACKUP_LABEL);
    await user.click(field);
    await user.paste("ABCD-12345 6");

    expect(field).toHaveValue("abcd123456");
  });

  it("does not auto-submit and submits with the button", async () => {
    const { user, action } = setup();
    await user.click(
      screen.getByRole("button", { name: "Usar un código de respaldo" }),
    );

    await user.type(screen.getByLabelText(BACKUP_LABEL), "abcd1234ef");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(action).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Verificar" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect((action.mock.calls[0][1] as FormData).get("code")).toBe("abcd1234ef");
  });

  it("goes back to the app code and clears what was typed", async () => {
    const { user } = setup();
    await user.click(
      screen.getByRole("button", { name: "Usar un código de respaldo" }),
    );
    await user.type(screen.getByLabelText(BACKUP_LABEL), "abc");

    await user.click(
      screen.getByRole("button", { name: "Usar el código de la app" }),
    );

    expect(screen.getByLabelText(APP_LABEL)).toHaveValue("");
    expect(screen.getByLabelText(APP_LABEL)).toHaveAttribute("inputmode", "numeric");
  });
});
