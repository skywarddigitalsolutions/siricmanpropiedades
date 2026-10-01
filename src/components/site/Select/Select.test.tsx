import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Select from "./Select";

afterEach(() => cleanup());

describe("Select", () => {
  it("renders a native select with its options and form attributes", () => {
    render(
      <Select name="orden" aria-label="Ordenar por" defaultValue="b">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );

    const select = screen.getByRole("combobox", { name: "Ordenar por" });
    expect(select.tagName).toBe("SELECT");
    expect(select).toHaveAttribute("name", "orden");
    expect(select).toHaveValue("b");
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("forwards onChange", async () => {
    const onChange = vi.fn();
    render(
      <Select aria-label="Tipo" onChange={onChange}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );

    await userEvent.selectOptions(screen.getByLabelText("Tipo"), "b");

    expect(onChange).toHaveBeenCalledTimes(1);
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
