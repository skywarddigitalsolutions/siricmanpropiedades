import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { makePublicProperty } from "@/test/fixtures/public-property";
import FeaturedSection from "./FeaturedSection";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const properties = ["a", "b", "c", "d"].map((id) =>
  makePublicProperty({ id, slug: `casa-${id}`, title: `Casa ${id}` }),
);

const sale = {
  operation: "sale" as const,
  eyebrow: "En venta",
  title: "Destacadas en venta",
  subtitle: "Una selección para comprar.",
};

describe("FeaturedSection", () => {
  it("renders the eyebrow, title, subtitle and the cards", () => {
    render(<FeaturedSection {...sale} properties={properties} />);

    const section = screen.getByRole("region", { name: "Destacadas en venta" });
    expect(within(section).getByText("En venta")).toBeInTheDocument();
    expect(within(section).getByText("Una selección para comprar.")).toBeInTheDocument();
    expect(within(section).getAllByRole("article")).toHaveLength(4);
    expect(within(section).getByRole("link", { name: /Casa a/ })).toHaveAttribute(
      "href",
      "/propiedades/casa-a",
    );
  });

  it("links 'Ver todas' to the results filtered by operation", () => {
    const { rerender } = render(<FeaturedSection {...sale} properties={properties} />);
    expect(screen.getByRole("link", { name: /Ver todas/ })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta",
    );

    rerender(
      <FeaturedSection
        operation="rent"
        eyebrow="En alquiler"
        title="Destacadas en alquiler"
        subtitle="s"
        properties={properties}
      />,
    );
    expect(screen.getByRole("link", { name: /Ver todas/ })).toHaveAttribute(
      "href",
      "/propiedades?operacion=alquiler",
    );
  });

  it("is named by its level-2 heading", () => {
    render(<FeaturedSection {...sale} properties={properties} />);

    const section = screen.getByRole("region", { name: "Destacadas en venta" });
    expect(
      within(section).getByRole("heading", { level: 2, name: "Destacadas en venta" }),
    ).toBeInTheDocument();
  });

  it("still renders with a single property (no minimum)", () => {
    render(<FeaturedSection {...sale} properties={properties.slice(0, 1)} />);

    const section = screen.getByRole("region", { name: "Destacadas en venta" });
    expect(within(section).getAllByRole("article")).toHaveLength(1);
    expect(within(section).getByRole("link", { name: /Ver todas/ })).toBeInTheDocument();
    expect(within(section).getByRole("button", { name: "Anterior" })).toBeInTheDocument();
    expect(within(section).getByRole("button", { name: "Siguiente" })).toBeInTheDocument();
  });

  it("renders nothing without properties", () => {
    const { container } = render(<FeaturedSection {...sale} properties={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  describe("arrows", () => {
    beforeEach(() => {
      Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 400 });
      Object.defineProperty(HTMLElement.prototype, "scrollWidth", { configurable: true, value: 1200 });
    });
    afterEach(() => {
      Reflect.deleteProperty(HTMLElement.prototype, "clientWidth");
      Reflect.deleteProperty(HTMLElement.prototype, "scrollWidth");
    });

    it("disables the arrows at the ends and scrolls by a page", () => {
      const scrollBy = vi.fn();
      HTMLElement.prototype.scrollBy = scrollBy;
      const { container } = render(<FeaturedSection {...sale} properties={properties} />);

      expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Siguiente" })).toBeEnabled();

      fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
      expect(scrollBy).toHaveBeenCalledTimes(1);
      expect(scrollBy.mock.calls[0][0].left).toBeGreaterThan(0);

      const track = container.querySelector("ul")!;
      Object.defineProperty(track, "scrollLeft", { configurable: true, value: 800 });
      fireEvent.scroll(track);

      expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Anterior" })).toBeEnabled();
    });
  });
});
