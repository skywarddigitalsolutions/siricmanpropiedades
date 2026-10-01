import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubmitButton from "./SubmitButton";

afterEach(() => {
  cleanup();
});

function DeferredForm({
  action,
  buttonText,
  pendingText,
}: {
  action: () => Promise<void>;
  buttonText: string;
  pendingText: string;
}) {
  return (
    <form action={action}>
      <SubmitButton pendingLabel={pendingText}>{buttonText}</SubmitButton>
    </form>
  );
}

describe("SubmitButton", () => {
  it("supports the ghost variant with an icon", () => {
    render(
      <form action={async () => {}}>
        <SubmitButton pendingLabel="..." variant="ghost" icon={<svg data-testid="i" />}>
          Salir
        </SubmitButton>
      </form>,
    );

    const button = screen.getByRole("button", { name: "Salir" });
    expect(button).toHaveAttribute("data-variant", "ghost");
    expect(screen.getByTestId("i")).toBeInTheDocument();
  });

  it("renders its label and is enabled while idle", () => {
    render(
      <DeferredForm
        action={async () => {}}
        buttonText="Ingresar"
        pendingText="Ingresando..."
      />,
    );

    const button = screen.getByRole("button", { name: "Ingresar" });
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute("aria-busy", "true");
  });

  it("disables itself, sets aria-busy, and shows the pending label while the action is in flight", async () => {
    let resolveAction!: () => void;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );
    render(
      <DeferredForm
        action={action}
        buttonText="Ingresar"
        pendingText="Ingresando..."
      />,
    );

    const user = userEvent.setup();
    const submitPromise = user.click(
      screen.getByRole("button", { name: "Ingresar" }),
    );

    const pendingButton = await screen.findByRole("button", {
      name: "Ingresando...",
    });
    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveAttribute("aria-busy", "true");

    resolveAction();
    await submitPromise;

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Ingresar" }),
      ).not.toBeDisabled();
    });
  });
});
