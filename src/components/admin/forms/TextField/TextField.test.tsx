import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import TextField from "./TextField";

afterEach(() => {
  cleanup();
});

describe("TextField", () => {
  it("renders a labeled input with no aria-invalid/aria-describedby when there is no error", () => {
    render(<TextField id="userName" name="userName" label="Usuario" />);

    const input = screen.getByLabelText("Usuario");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("wires aria-invalid and aria-describedby to the rendered error message when error is set", () => {
    render(
      <TextField
        id="userName"
        name="userName"
        label="Usuario"
        error="Complete todos los campos."
      />,
    );

    const input = screen.getByLabelText("Usuario");
    expect(input).toHaveAttribute("aria-invalid", "true");

    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? "")).toHaveTextContent(
      "Complete todos los campos.",
    );
  });
});
