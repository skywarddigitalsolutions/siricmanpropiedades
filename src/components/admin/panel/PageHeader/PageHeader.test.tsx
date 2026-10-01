import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PageHeader from "./PageHeader";

afterEach(() => {
  cleanup();
});

describe("PageHeader", () => {
  it("renders the title as a level-1 heading", () => {
    render(<PageHeader title="Propiedades" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Propiedades" }),
    ).toBeInTheDocument();
  });

  it("renders an optional description", () => {
    render(
      <PageHeader title="Propiedades" description="Catálogo completo" />,
    );

    expect(screen.getByText("Catálogo completo")).toBeInTheDocument();
  });

  it("does not render a description paragraph when none is given", () => {
    render(<PageHeader title="Propiedades" />);

    expect(screen.queryByText("Catálogo completo")).not.toBeInTheDocument();
  });

  it("renders the optional actions slot", () => {
    render(
      <PageHeader
        title="Propiedades"
        actions={<button>Nueva propiedad</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Nueva propiedad" }),
    ).toBeInTheDocument();
  });
});
