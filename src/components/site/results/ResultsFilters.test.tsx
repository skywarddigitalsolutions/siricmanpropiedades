import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseSearchParams } from "@/lib/public/search-params";
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
    expect(within(operations).getByRole("link", { name: "Alquiler" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=alquiler&barrio=palermo",
    );
    expect(within(operations).getByRole("link", { name: "Venta" })).toHaveAttribute(
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

    const select = screen.getByLabelText("Barrio");
    expect(select).toHaveValue("palermo");
    const form = select.closest("form")!;
    expect(form).toHaveAttribute("action", "/propiedades");
    expect(form.querySelector('input[type="hidden"][name="operacion"]')).toHaveValue("venta");
    expect(form.querySelector('input[type="hidden"][name="cochera"]')).toHaveValue("1");
    expect(form.querySelector('input[type="hidden"][name="barrio"]')).toBeNull();
  });

  it("toggles quick filters through links", () => {
    render(
      <ResultsFilterBar
        state={parseSearchParams({ tipo: "casa", credito: "1" })}
        neighborhoods={NEIGHBORHOODS}
      />,
    );

    const quick = screen.getByRole("list", { name: "Filtros rápidos" });
    expect(within(quick).getByRole("link", { name: /Casa/ })).toHaveAttribute(
      "href",
      "/propiedades?credito=1",
    );
    expect(within(quick).getByRole("link", { name: /PH/ })).toHaveAttribute(
      "href",
      "/propiedades?tipo=ph&credito=1",
    );
    expect(within(quick).getByRole("link", { name: /Apto crédito/ })).toHaveTextContent(
      "(activo)",
    );
  });
});

describe("FiltersSheet", () => {
  it("opens a dialog with every filter preset from the URL", async () => {
    const user = userEvent.setup();
    render(
      <FiltersSheet
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
    expect(within(dialog).getByRole("radio", { name: "USD" })).toBeChecked();
    expect(within(dialog).getByLabelText("Desde")).toHaveValue("100000");
    expect(within(dialog).getByRole("checkbox", { name: "Acepta mascotas" })).toBeChecked();
    const form = within(dialog).getByRole("button", { name: "Ver resultados" }).closest("form")!;
    expect(form.querySelector('input[type="hidden"][name="operacion"]')).toHaveValue("venta");
    expect(form.querySelector('input[type="hidden"][name="barrio"]')).toHaveValue("palermo");
    expect(within(dialog).getByRole("link", { name: "Limpiar" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta&barrio=palermo",
    );
  });

  it("closes the dialog", async () => {
    const user = userEvent.setup();
    render(<FiltersSheet state={parseSearchParams({})} />);

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

    await user.selectOptions(select, "menor-precio");

    expect(submit).toHaveBeenCalled();
    const form = select.closest("form")!;
    expect(form.querySelector('input[type="hidden"][name="operacion"]')).toHaveValue("alquiler");
    expect(form.querySelector('input[type="hidden"][name="pagina"]')).toBeNull();
  });
});
