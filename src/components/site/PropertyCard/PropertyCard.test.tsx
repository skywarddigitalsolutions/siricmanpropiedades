import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { makePublicProperty } from "@/test/fixtures/public-property";
import PropertyCard from "./PropertyCard";

describe("PropertyCard", () => {
  it("links the title to the property page and shows the key data", () => {
    render(<PropertyCard property={makePublicProperty()} />);

    const card = screen.getByRole("article");
    expect(within(card).getByRole("link", { name: /Luminoso 3 ambientes/ })).toHaveAttribute(
      "href",
      "/propiedades/luminoso-3-ambientes-con-balcon",
    );
    expect(within(card).getByText("US$ 185.000")).toBeInTheDocument();
    expect(within(card).getByText("+ $ 145.000 expensas")).toBeInTheDocument();
    expect(within(card).getByText("Venta")).toBeInTheDocument();
    expect(within(card).getByText(/Departamento · Palermo/)).toBeInTheDocument();
    expect(within(card).getByText("2 dormitorios")).toBeInTheDocument();
  });

  it("uses the cover photo with a descriptive alt, or a placeholder without photos", () => {
    const { rerender } = render(<PropertyCard property={makePublicProperty()} />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://media.test/p1-thumb.webp");

    rerender(<PropertyCard property={makePublicProperty({ coverImage: null })} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Sin fotos")).toBeInTheDocument();
  });

  it("shows the marketing tag and a status band for unavailable properties", () => {
    render(
      <PropertyCard
        property={makePublicProperty({ marketingTag: "opportunity", dealStatus: "sold" })}
      />,
    );

    expect(screen.getByText("Oportunidad")).toBeInTheDocument();
    expect(screen.getByText("Vendida")).toBeInTheDocument();
  });

  it("does not show the internal property code on the card", () => {
    render(<PropertyCard property={makePublicProperty()} />);

    expect(within(screen.getByRole("article")).queryByText("SP-0101")).toBeNull();
  });

  it("uses the requested heading level", () => {
    render(<PropertyCard property={makePublicProperty()} headingLevel={2} />);

    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });
});

describe("PropertyCard favorite heart", () => {
  it("has a heart toggle that is not nested inside the title link", () => {
    render(<PropertyCard property={makePublicProperty()} />);
    const card = screen.getByRole("article");
    const heart = within(card).getByRole("button", { name: "Guardar en favoritos" });
    expect(heart.closest("a")).toBeNull();
  });
});
