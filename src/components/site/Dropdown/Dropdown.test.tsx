import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import Dropdown from "./Dropdown";

afterEach(() => cleanup());

const OPTIONS = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
  { value: "c", label: "Charlie", disabled: true },
  { value: "d", label: "Delta" },
];

function setup(props: Partial<ComponentProps<typeof Dropdown>> = {}) {
  return render(
    <form>
      <label htmlFor="dd">Letra</label>
      <Dropdown id="dd" name="letter" options={OPTIONS} {...props} />
    </form>,
  );
}

const trigger = () => screen.getByRole("combobox", { name: "Letra" });
const hidden = (c: HTMLElement) =>
  c.querySelector<HTMLInputElement>('input[type="hidden"][name="letter"]')!;
const optionId = (name: string) => screen.getByRole("option", { name }).id;

describe("Dropdown", () => {
  it("exposes the select-only combobox pattern on a button", () => {
    setup({ defaultValue: "b" });

    const el = trigger();
    expect(el.tagName).toBe("BUTTON");
    expect(el).toHaveAttribute("aria-haspopup", "listbox");
    expect(el).toHaveAttribute("aria-expanded", "false");
    expect(el).toHaveTextContent("Bravo");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("carries the value in a hidden input so plain forms keep working", () => {
    const { container } = setup({ defaultValue: "b" });

    expect(hidden(container)).toHaveValue("b");
  });

  it("falls back to the first option when the default matches none", () => {
    const { container } = setup({ defaultValue: "zzz" });

    expect(trigger()).toHaveTextContent("Alpha");
    expect(hidden(container)).toHaveValue("a");
  });

  it("opens on click with options, selected state and wiring", async () => {
    const user = userEvent.setup();
    setup({ defaultValue: "b" });

    await user.click(trigger());

    const listbox = screen.getByRole("listbox");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("aria-controls", listbox.id);
    expect(screen.getAllByRole("option")).toHaveLength(4);
    expect(screen.getByRole("option", { name: "Bravo" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "Alpha" })).toHaveAttribute("aria-selected", "false");
    expect(trigger()).toHaveAttribute("aria-activedescendant", optionId("Bravo"));
  });

  it("selects with a click, closes, updates the hidden input and calls onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = setup({ defaultValue: "a", onChange });

    await user.click(trigger());
    await user.click(screen.getByRole("option", { name: "Delta" }));

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(trigger()).toHaveTextContent("Delta");
    expect(hidden(container)).toHaveValue("d");
    expect(onChange).toHaveBeenCalledWith("d", expect.any(HTMLFormElement));
  });

  it("writes the hidden input before onChange so a handler can submit the form", async () => {
    const user = userEvent.setup();
    let seen = "";
    const { container } = setup({
      defaultValue: "a",
      onChange: () => {
        seen = hidden(container).value;
      },
    });

    await user.click(trigger());
    await user.click(screen.getByRole("option", { name: "Bravo" }));

    expect(seen).toBe("b");
  });

  it("does not select disabled options", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup({ defaultValue: "a", onChange });

    await user.click(trigger());
    await user.click(screen.getByRole("option", { name: "Charlie" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("opens with Enter, Space or ArrowDown", async () => {
    const user = userEvent.setup();
    setup();

    trigger().focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.keyboard(" ");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("moves with arrows (skipping disabled), Home and End, and selects with Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup({ defaultValue: "b", onChange });

    trigger().focus();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");
    expect(trigger()).toHaveAttribute("aria-activedescendant", optionId("Delta"));
    await user.keyboard("{ArrowDown}");
    expect(trigger()).toHaveAttribute("aria-activedescendant", optionId("Delta"));
    await user.keyboard("{Home}");
    expect(trigger()).toHaveAttribute("aria-activedescendant", optionId("Alpha"));
    await user.keyboard("{ArrowUp}");
    expect(trigger()).toHaveAttribute("aria-activedescendant", optionId("Alpha"));
    await user.keyboard("{End}");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith("d", expect.any(HTMLFormElement));
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it("selects with Space while open", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup({ defaultValue: "a", onChange });

    trigger().focus();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard(" ");

    expect(onChange).toHaveBeenCalledWith("b", expect.any(HTMLFormElement));
  });

  it("jumps by first letter (type-ahead)", async () => {
    const user = userEvent.setup();
    setup({ defaultValue: "a" });

    trigger().focus();
    await user.keyboard("{Enter}");
    await user.keyboard("d");

    expect(trigger()).toHaveAttribute("aria-activedescendant", optionId("Delta"));
  });

  it("closes with Escape and returns focus to the trigger without changing the value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup({ defaultValue: "a", onChange });

    await user.click(trigger());
    await user.keyboard("{ArrowDown}{Escape}");

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(trigger()).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("selects the active option on Tab and lets focus move on", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup({ defaultValue: "a", onChange });

    trigger().focus();
    await user.keyboard("{Enter}{ArrowDown}");
    await user.tab();

    expect(onChange).toHaveBeenCalledWith("b", expect.any(HTMLFormElement));
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(trigger()).not.toHaveFocus();
  });

  it("closes when clicking outside", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(trigger());
    await user.click(document.body);

    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    setup({ disabled: true });

    await user.click(trigger());

    expect(trigger()).toBeDisabled();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("follows a controlled value", () => {
    const { container, rerender } = setup({ value: "b", onChange: () => {} });
    expect(trigger()).toHaveTextContent("Bravo");

    rerender(
      <form>
        <label htmlFor="dd">Letra</label>
        <Dropdown id="dd" name="letter" options={OPTIONS} value="d" onChange={() => {}} />
      </form>,
    );

    expect(trigger()).toHaveTextContent("Delta");
    expect(hidden(container)).toHaveValue("d");
  });

  it("blocks submit when required and empty, flags it invalid and focuses the trigger", () => {
    const { container } = setup({
      required: true,
      defaultValue: "",
      options: [{ value: "", label: "Elegí una opción", disabled: true }, ...OPTIONS],
    });
    const form = container.querySelector("form")!;
    const submit = vi.fn();
    form.addEventListener("submit", submit);

    const allowed = fireEvent.submit(form);

    expect(allowed).toBe(false);
    expect(trigger()).toHaveAttribute("aria-invalid", "true");
    expect(trigger()).toHaveFocus();
  });

  it("passes aria-invalid and aria-describedby through", () => {
    setup({ "aria-invalid": true, "aria-describedby": "err" });

    expect(trigger()).toHaveAttribute("aria-invalid", "true");
    expect(trigger()).toHaveAttribute("aria-describedby", "err");
  });
});
