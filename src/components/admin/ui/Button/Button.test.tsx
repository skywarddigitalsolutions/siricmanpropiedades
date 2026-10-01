import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Plus } from "lucide-react";
import Button, { ButtonLink } from "./Button";

afterEach(cleanup);

describe("Button", () => {
  it("renders a button with the variant and a leading icon", () => {
    render(
      <Button variant="secondary" icon={<Plus aria-hidden />}>
        Guardar
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Guardar" });
    expect(button).toHaveAttribute("data-variant", "secondary");
    expect(button).toHaveAttribute("type", "button");
    expect(button.querySelector("svg")).not.toBeNull();
  });

  it("defaults to the primary variant", () => {
    render(<Button>Ok</Button>);
    expect(screen.getByRole("button", { name: "Ok" })).toHaveAttribute("data-variant", "primary");
  });
});

describe("ButtonLink", () => {
  it("renders a link with the href, variant and icon", () => {
    render(
      <ButtonLink href="/admin/propiedades/nueva" icon={<Plus aria-hidden />}>
        Nueva propiedad
      </ButtonLink>,
    );

    const link = screen.getByRole("link", { name: "Nueva propiedad" });
    expect(link).toHaveAttribute("href", "/admin/propiedades/nueva");
    expect(link).toHaveAttribute("data-variant", "primary");
    expect(link.querySelector("svg")).not.toBeNull();
  });

  it("renders a plain anchor when native (downloads)", () => {
    render(
      <ButtonLink href="/x.csv" native variant="secondary">
        Exportar
      </ButtonLink>,
    );

    expect(screen.getByRole("link", { name: "Exportar" })).toHaveAttribute("href", "/x.csv");
  });
});
