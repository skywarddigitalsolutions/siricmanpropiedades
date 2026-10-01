import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import CheckboxField from "./CheckboxField";

afterEach(() => {
  cleanup();
});

describe("CheckboxField", () => {
  it("renders a checkbox associated with its label text", () => {
    render(<CheckboxField id="featured" name="featured" label="Destacada" />);

    const checkbox = screen.getByLabelText("Destacada");
    expect(checkbox).toHaveAttribute("type", "checkbox");
  });

  it("reflects the checked state from defaultChecked", () => {
    render(
      <CheckboxField
        id="featured"
        name="featured"
        label="Destacada"
        defaultChecked
      />,
    );

    expect(screen.getByLabelText("Destacada")).toBeChecked();
  });

  it("wires aria-invalid and aria-describedby to the rendered error message when error is set", () => {
    render(
      <CheckboxField
        id="featured"
        name="featured"
        label="Destacada"
        error="Campo requerido."
      />,
    );

    const checkbox = screen.getByLabelText("Destacada");
    expect(checkbox).toHaveAttribute("aria-invalid", "true");

    const describedBy = checkbox.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? "")).toHaveTextContent(
      "Campo requerido.",
    );
  });

  it("has no aria-invalid/aria-describedby when there is no error", () => {
    render(<CheckboxField id="featured" name="featured" label="Destacada" />);

    const checkbox = screen.getByLabelText("Destacada");
    expect(checkbox).not.toHaveAttribute("aria-invalid");
    expect(checkbox).not.toHaveAttribute("aria-describedby");
  });
});
