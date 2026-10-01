import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import SelectField from "./SelectField";

afterEach(() => {
  cleanup();
});

const options = [
  { value: "venta", label: "Venta" },
  { value: "alquiler", label: "Alquiler" },
];

describe("SelectField", () => {
  it("renders a labeled select with the given options", () => {
    render(
      <SelectField
        id="operation"
        name="operation"
        label="Operación"
        options={options}
      />,
    );

    const select = screen.getByLabelText("Operación");
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Venta" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Alquiler" }),
    ).toBeInTheDocument();
  });

  it("renders an empty-value placeholder as the first option when given", () => {
    render(
      <SelectField
        id="operation"
        name="operation"
        label="Operación"
        options={options}
        placeholder="Seleccionar..."
      />,
    );

    const select = screen.getByLabelText("Operación") as HTMLSelectElement;
    expect(select.options[0].value).toBe("");
    expect(select.options[0].textContent).toBe("Seleccionar...");
  });

  it("does not render a placeholder option when none is given", () => {
    render(
      <SelectField
        id="operation"
        name="operation"
        label="Operación"
        options={options}
      />,
    );

    const select = screen.getByLabelText("Operación") as HTMLSelectElement;
    expect(select.options[0].value).toBe("venta");
  });

  it("wires aria-invalid and aria-describedby to the rendered error message when error is set", () => {
    render(
      <SelectField
        id="operation"
        name="operation"
        label="Operación"
        options={options}
        error="Seleccione una operación."
      />,
    );

    const select = screen.getByLabelText("Operación");
    expect(select).toHaveAttribute("aria-invalid", "true");

    const describedBy = select.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? "")).toHaveTextContent(
      "Seleccione una operación.",
    );
  });

  it("has no aria-invalid/aria-describedby when there is no error", () => {
    render(
      <SelectField
        id="operation"
        name="operation"
        label="Operación"
        options={options}
      />,
    );

    const select = screen.getByLabelText("Operación");
    expect(select).not.toHaveAttribute("aria-invalid");
    expect(select).not.toHaveAttribute("aria-describedby");
  });
});

describe("SelectField chevron", () => {
  it("draws a decorative chevron next to the native select", () => {
    const { container } = render(
      <SelectField id="x" name="x" label="X" options={options} />,
    );

    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(container.querySelector("select")).not.toBeNull();
  });
});
