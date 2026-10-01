import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LocationCombobox from "./LocationCombobox";

afterEach(() => cleanup());

const NEIGHBORHOODS = [
  { id: "1", name: "Palermo", slug: "palermo" },
  { id: "2", name: "Núñez", slug: "nunez" },
  { id: "3", name: "Belgrano", slug: "belgrano" },
  { id: "4", name: "Villa Urquiza", slug: "villa-urquiza" },
  { id: "5", name: "Recoleta", slug: "recoleta" },
];

function setup(props: Partial<React.ComponentProps<typeof LocationCombobox>> = {}) {
  const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
  const utils = render(
    <form onSubmit={onSubmit}>
      <LocationCombobox neighborhoods={NEIGHBORHOODS} {...props} />
      <button type="submit">Buscar</button>
    </form>,
  );
  const input = screen.getByRole("combobox", { name: "Barrio" });
  const hidden = () => utils.container.querySelector<HTMLInputElement>('input[name="barrio"]')!;
  return { input, hidden, onSubmit, user: userEvent.setup() };
}

describe("LocationCombobox", () => {
  it("exposes the ARIA combobox contract and mobile-friendly input attributes", async () => {
    const { input, user } = setup();

    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveAttribute("inputmode", "search");
    expect(input).toHaveAttribute("enterkeyhint", "search");
    expect(input).toHaveAttribute("placeholder", "Ingresá un barrio (ej: Palermo)");

    await user.type(input, "pal");

    expect(input).toHaveAttribute("aria-expanded", "true");
    const listbox = screen.getByRole("listbox");
    expect(input).toHaveAttribute("aria-controls", listbox.id);
    expect(input).toHaveAttribute("aria-activedescendant", screen.getAllByRole("option")[0].id);
  });

  it("filters while typing, ignoring accents and case", async () => {
    const { input, user } = setup();

    await user.type(input, "NUNE");

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: "Núñez" })).toBeInTheDocument();
  });

  it("highlights the matched part", async () => {
    const { input, user } = setup();
    await user.type(input, "urq");

    const mark = screen.getByRole("option").querySelector("mark");
    expect(mark).toHaveTextContent("Urq");
  });

  it("moves with the arrows and selects with Enter, filling the hidden slug", async () => {
    const { input, hidden, onSubmit, user } = setup();
    await user.type(input, "e"); // Belgrano, Núñez?, Recoleta, Palermo... several

    await user.keyboard("{ArrowDown}");
    const options = screen.getAllByRole("option");
    expect(input).toHaveAttribute("aria-activedescendant", options[1].id);
    expect(options[1]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Enter}");

    const chosen = NEIGHBORHOODS.find((n) => n.name === options[1].textContent)!;
    expect(hidden().value).toBe(chosen.slug);
    expect(input).toHaveValue(chosen.name);
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("supports Home and End", async () => {
    const { input, user } = setup();
    await user.type(input, "e");
    const options = screen.getAllByRole("option");

    await user.keyboard("{End}");
    expect(input).toHaveAttribute("aria-activedescendant", options.at(-1)!.id);
    await user.keyboard("{Home}");
    expect(input).toHaveAttribute("aria-activedescendant", options[0].id);
  });

  it("selects the highlighted option on Tab", async () => {
    const { input, hidden, user } = setup();
    await user.type(input, "bel");

    await user.tab();

    expect(hidden().value).toBe("belgrano");
    expect(input).toHaveValue("Belgrano");
  });

  it("closes with Escape without selecting", async () => {
    const { input, hidden, user } = setup();
    await user.type(input, "pal");

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(hidden().value).toBe("");
  });

  it("selects an option by clicking it", async () => {
    const { input, hidden, user } = setup();
    await user.type(input, "pal");

    await user.click(screen.getByRole("option", { name: "Palermo" }));

    expect(hidden().value).toBe("palermo");
    expect(input).toHaveValue("Palermo");
  });

  it("shows an empty state when nothing matches and submits without barrio", async () => {
    const { input, hidden, onSubmit, user } = setup();
    await user.type(input, "zzz");

    expect(screen.getByText("Sin coincidencias")).toBeInTheDocument();
    expect(screen.queryByRole("option")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(hidden().value).toBe("");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("resolves a single partial match when the form is submitted", async () => {
    const { input, hidden, onSubmit, user } = setup();
    await user.type(input, "nun");
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(hidden().value).toBe("nunez");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("starts with the given barrio and clears it with the X button", async () => {
    const { input, hidden, user } = setup({ defaultSlug: "palermo" });
    expect(input).toHaveValue("Palermo");
    expect(hidden().value).toBe("palermo");

    await user.click(screen.getByRole("button", { name: "Borrar barrio" }));

    expect(input).toHaveValue("");
    expect(hidden().value).toBe("");
    expect(input).toHaveFocus();
  });

  it("offers popular barrios when focused and empty", async () => {
    const { input, user } = setup();
    await user.click(input);

    expect(screen.getByText("Barrios populares")).toBeInTheDocument();
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Palermo",
      "Belgrano",
      "Recoleta",
      "Villa Urquiza",
      "Núñez",
    ]);
  });

  it("submits the form when autoSubmit is on and an option is chosen", async () => {
    const { input, hidden, onSubmit, user } = setup({ autoSubmit: true });
    await user.type(input, "bel");

    await user.keyboard("{Enter}");

    expect(hidden().value).toBe("belgrano");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
