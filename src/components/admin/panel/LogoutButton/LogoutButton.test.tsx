import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LogoutButton from "./LogoutButton";

afterEach(() => {
  cleanup();
});

describe("LogoutButton", () => {
  it("submits the passed Server Action when clicked", async () => {
    let resolveAction!: () => void;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<LogoutButton action={action} />);

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(action).toHaveBeenCalledTimes(1);
    resolveAction();
  });

  it("shows a pending state via SubmitButton while the action is running", async () => {
    let resolveAction!: () => void;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<LogoutButton action={action} />);

    const clickPromise = user.click(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    );

    expect(
      await screen.findByRole("button", { name: /Cerrando/ }),
    ).toBeDisabled();

    resolveAction();
    await clickPromise;
  });
});
