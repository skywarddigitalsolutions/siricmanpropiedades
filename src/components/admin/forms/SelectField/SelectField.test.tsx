import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dropdownValue, openLabels } from "@/test/dropdown";
import SelectField from "./SelectField";

afterEach(() => {
  cleanup();
});

const options = [
  { value: "venta", label: "Venta" },
  { value: "alquiler", label: "Alquiler" },
];

describe("SelectField", () => {
  it("renders a labeled dropdown with the given options", async () => {
    const user = userEvent.setup();
    render(<SelectField id="operation" name="operation" label="Operación" options={options} />);

    const trigger = screen.getByLabelText("Operación");
    expect(trigger).toHaveAttribute("role", "combobox");
    expect(await openLabels(user, trigger)).toEqual(["Venta", "Alquiler"]);
  });

  it("offers an empty-value placeholder as the first option when given", async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        id="operation"
        name="operation"
        label="Operación"
        options={options}
        placeholder="Seleccionar..."
      />,
    );

    const trigger = screen.getByLabelText("Operación");
    expect(trigger).toHaveTextContent("Seleccionar...");
    expect(dropdownValue(trigger)).toBe("");
    expect(await openLabels(user, trigger)).toEqual(["Seleccionar...", "Venta", "Alquiler"]);
  });

  it("starts on the first option when no placeholder is given", () => {
    render(<SelectField id="operation" name="operation" label="Operación" options={options} />);

    expect(dropdownValue(screen.getByLabelText("Operación"))).toBe("venta");
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
  it("draws a decorative chevron and no native select", () => {
    const { container } = render(
      <SelectField id="x" name="x" label="X" options={options} />,
    );

    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(container.querySelector("select")).toBeNull();
  });
});
