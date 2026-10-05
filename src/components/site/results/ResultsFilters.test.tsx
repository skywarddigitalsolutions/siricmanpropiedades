import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseSearchParams } from "@/lib/public/search-params";
import { pick } from "@/test/dropdown";
import FiltersSheet from "./FiltersSheet/FiltersSheet";
import ResultsFilterBar from "./ResultsFilterBar/ResultsFilterBar";
import ResultsSort from "./ResultsSort/ResultsSort";

afterEach(() => cleanup());

const NEIGHBORHOODS = [
  { id: "n1", name: "Palermo", slug: "palermo" },
  { id: "n2", name: "Belgrano", slug: "belgrano" },
];

describe("ResultsFilterBar", () => {
  it("links the operations and marks the current one", () => {
    render(
      <ResultsFilterBar
        state={parseSearchParams({ operacion: "venta", barrio: "palermo" })}
        neighborhoods={NEIGHBORHOODS}
      />,
    );

    const operations = screen.getByRole("navigation", { name: "Operación" });
    expect(within(operations).getByRole("link", { name: "Alquilar" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=alquiler&barrio=palermo",
    );
    expect(within(operations).getByRole("link", { name: "Comprar" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("filters by barrio with a GET form that keeps the other filters", () => {
    render(
      <ResultsFilterBar
        state={parseSearchParams({ operacion: "venta", cochera: "1", barrio: "palermo" })}
        neighborhoods={NEIGHBORHOODS}
      />,
    );

    const combobox = screen.getByRole("combobox", { name: "Barrio" });
    expect(combobox).toHaveValue("Palermo");
    const form = combobox.closest("form")!;
    expect(form).toHaveAttribute("action", "/propiedades");
    expect(form.querySelector('input[type="hidden"][name="operacion"]')).toHaveValue("venta");
    expect(form.querySelector('input[type="hidden"][name="cochera"]')).toHaveValue("1");
    expect(form.querySelector('input[type="hidden"][name="barrio"]')).toHaveValue("palermo");
  });

  it("submits the barrio form as soon as a barrio is picked", async () => {
    const submit = vi.spyOn(HTMLFormElement.prototype, "requestSubmit").mockImplementation(() => {});
    render(
      <ResultsFilterBar state={parseSearchParams({ operacion: "venta" })} neighborhoods={NEIGHBORHOODS} />,
    );

    await userEvent.type(screen.getByRole("combobox", { name: "Barrio" }), "belg{Enter}");

    expect(submit).toHaveBeenCalledTimes(1);
    submit.mockRestore();
  });

  it("summarizes several barrios in the combobox and keeps them in the form", () => {
    render(
      <ResultsFilterBar
        state={parseSearchParams({ barrio: "palermo,belgrano" })}
        neighborhoods={NEIGHBORHOODS}
      />,
    );
    const combobox = screen.getByRole("combobox", { name: "Barrio" });
    expect(combobox).toHaveValue("2 barrios");
    expect(combobox.closest("form")!.querySelector('input[name="barrio"]')).toHaveValue(
      "palermo,belgrano",
    );
  });

  it("keeps the bar to operation, barrio and the filters button (no quick chips)", () => {
    render(
      <ResultsFilterBar
        state={parseSearchParams({ tipo: "casa", credito: "1" })}
        neighborhoods={NEIGHBORHOODS}
      />,
    );

    expect(screen.queryByRole("list", { name: "Filtros rápidos" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Departamento|Apto crédito|Mascotas|Cochera/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Filtros · 2" })).toBeInTheDocument();
  });
});

describe("FiltersSheet", () => {
  it("opens a dialog with every filter preset from the URL", async () => {
    const user = userEvent.setup();
    render(
      <FiltersSheet
        neighborhoods={NEIGHBORHOODS}
        state={parseSearchParams({
          operacion: "venta",
          barrio: "palermo",
          tipo: "casa",
          ambientes: "3",
          moneda: "USD",
          desde: "100000",
          mascotas: "1",
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Filtros · 4" }));

    const dialog = screen.getByRole("dialog", { name: "Filtros" });
    expect(within(dialog).getByRole("radio", { name: "Casa" })).toBeChecked();
    expect(within(dialog).getByRole("radio", { name: "3" })).toBeChecked();
    expect(within(dialog).getByRole("radio", { name: "Dólares" })).toBeChecked();
    expect(within(dialog).getByLabelText("Desde")).toHaveValue("100000");
    expect(within(dialog).getByRole("checkbox", { name: "Acepta mascotas" })).toBeChecked();
    const form = within(dialog).getByRole("button", { name: "Ver resultados" }).closest("form")!;
    expect(form.querySelector('input[type="hidden"][name="barrio"]')).toHaveValue("palermo");
    expect(within(dialog).getByRole("link", { name: "Limpiar" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta&barrio=palermo",
    );
  });

  it("shows the currency symbol inside the price inputs and follows the toggle", async () => {
    const user = userEvent.setup();
    render(<FiltersSheet neighborhoods={NEIGHBORHOODS} state={parseSearchParams({ operacion: "venta", moneda: "USD" })} />);

    await user.click(screen.getByRole("button", { name: "Filtros" }));
    const dialog = screen.getByRole("dialog", { name: "Filtros" });
    expect(within(dialog).getByLabelText("Desde").parentElement).toHaveTextContent("US$");
    expect(within(dialog).getByLabelText("Hasta").parentElement).toHaveTextContent("US$");

    await user.click(within(dialog).getByRole("radio", { name: "Pesos" }));
    expect(within(dialog).getByLabelText("Desde").parentElement).not.toHaveTextContent("US$");
  });

  it("does not repeat the operation in the sheet but keeps it as a hidden param", async () => {
    const user = userEvent.setup();
    render(
      <FiltersSheet neighborhoods={NEIGHBORHOODS} state={parseSearchParams({ operacion: "venta" })} />,
    );
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    const dialog = screen.getByRole("dialog", { name: "Filtros" });
    expect(within(dialog).queryByRole("group", { name: "Operación" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("radio", { name: "Comprar" })).not.toBeInTheDocument();
    const form = within(dialog).getByRole("button", { name: "Ver resultados" }).closest("form")!;
    expect(form.querySelector('input[type="hidden"][name="operacion"]')).toHaveValue("venta");
  });

  it("selects several barrios and submits them as one comma-separated param", async () => {
    const user = userEvent.setup();
    render(
      <FiltersSheet neighborhoods={NEIGHBORHOODS} state={parseSearchParams({ barrio: "palermo" })} />,
    );
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    const dialog = screen.getByRole("dialog", { name: "Filtros" });
    const form = within(dialog).getByRole("button", { name: "Ver resultados" }).closest("form")!;
    const hidden = () => form.querySelector('input[type="hidden"][name="barrio"]');

    expect(within(dialog).getByRole("button", { name: "Quitar Palermo" })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("checkbox", { name: "Belgrano" }));
    expect(hidden()).toHaveValue("palermo,belgrano");

    await user.click(within(dialog).getByRole("button", { name: "Quitar Palermo" }));
    expect(hidden()).toHaveValue("belgrano");
    expect(within(dialog).getByRole("checkbox", { name: "Palermo" })).not.toBeChecked();
  });

  it("filters the barrio list ignoring accents and case", async () => {
    const user = userEvent.setup();
    render(
      <FiltersSheet
        neighborhoods={[...NEIGHBORHOODS, { id: "n3", name: "Núñez", slug: "nunez" }]}
        state={parseSearchParams({})}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    const dialog = screen.getByRole("dialog", { name: "Filtros" });
    await user.type(within(dialog).getByRole("searchbox", { name: "Buscar barrio" }), "NUNE");

    expect(within(dialog).getByRole("checkbox", { name: "Núñez" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("checkbox", { name: "Palermo" })).toBeNull();
  });

  it("stops at 10 barrios", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 11 }, (_, i) => ({
      id: `${i}`,
      name: `Barrio ${i}`,
      slug: `b-${i}`,
    }));
    render(<FiltersSheet neighborhoods={many} state={parseSearchParams({})} />);
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    const dialog = screen.getByRole("dialog", { name: "Filtros" });
    for (const n of many.slice(0, 10)) {
      await user.click(within(dialog).getByRole("checkbox", { name: n.name }));
    }
    expect(within(dialog).getByRole("checkbox", { name: "Barrio 10" })).toBeDisabled();
  });

  it("closes the dialog", async () => {
    const user = userEvent.setup();
    render(<FiltersSheet neighborhoods={NEIGHBORHOODS} state={parseSearchParams({})} />);

    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await user.click(screen.getByRole("button", { name: "Cerrar filtros" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("ResultsSort", () => {
  it("submits the chosen order with the current filters", async () => {
    const user = userEvent.setup();
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(<ResultsSort state={parseSearchParams({ operacion: "alquiler", pagina: "3" })} />);
    const select = screen.getByLabelText("Ordenar por");
    select.closest("form")!.addEventListener("submit", submit);

    await pick(user, select, "Menor precio");

    expect(submit).toHaveBeenCalled();
    const form = select.closest("form")!;
    expect(form.querySelector('input[type="hidden"][name="operacion"]')).toHaveValue("alquiler");
    expect(form.querySelector('input[type="hidden"][name="pagina"]')).toBeNull();
  });
});
