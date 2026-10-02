import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dropdownValue, openLabels, pick } from "@/test/dropdown";
import Select from "./Select";

afterEach(() => cleanup());

describe("Select", () => {
  it("renders a styled dropdown built from its option children, with form attributes", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Select name="orden" aria-label="Ordenar por" defaultValue="b">
        <option value="a">A</option>
        <option value="b">B</option>
        <option value="" disabled>
          Elegí
        </option>
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Ordenar por" });
    expect(trigger.tagName).toBe("BUTTON");
    expect(container.querySelector("select")).toBeNull();
    expect(trigger).toHaveTextContent("B");
    expect(dropdownValue(trigger)).toBe("b");
    expect(container.querySelector('input[type="hidden"][name="orden"]')).not.toBeNull();
    expect(await openLabels(user, trigger)).toEqual(["A", "B"]);
  });

  it("forwards onChange with the chosen value and its form", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <form>
        <Select aria-label="Tipo" name="t" onChange={onChange}>
          <option value="a">A</option>
          <option value="b">B</option>
        </Select>
      </form>,
    );

    await pick(user, screen.getByLabelText("Tipo"), "B");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("b", expect.any(HTMLFormElement));
  });

  it("forwards disabled and keeps the chevron decorative", () => {
    const { container } = render(
      <Select aria-label="Tipo" disabled>
        <option value="a">A</option>
      </Select>,
    );

    expect(screen.getByLabelText("Tipo")).toBeDisabled();
    const chevron = container.querySelector("svg");
    expect(chevron).not.toBeNull();
    expect(chevron).toHaveAttribute("aria-hidden", "true");
  });
});
