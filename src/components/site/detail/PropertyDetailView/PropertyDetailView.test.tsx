import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { makePublicPropertyDetail } from "@/test/fixtures/public-property";
import PropertyDetailView from "./PropertyDetailView";

const inquiryAction = vi.fn();

afterEach(() => cleanup());

function locationSection() {
  return screen.getByRole("heading", { name: "Ubicación" }).closest("section") as HTMLElement;
}

describe("PropertyDetailView location", () => {
  it("embeds a map pinned to the exact address when it is public", () => {
    render(<PropertyDetailView property={makePublicPropertyDetail()} inquiryAction={inquiryAction} />);

    const map = within(locationSection()).getByTitle("Mapa de la ubicación");
    expect(map).toHaveAttribute("src", expect.stringContaining("Gorriti%204800%2C%20Palermo%2C%20CABA"));
    expect(map).toHaveAttribute("src", expect.stringContaining("z=16"));
    expect(within(locationSection()).queryByText(/Gorriti 4800/)).toBeNull();
  });

  it("shows only the barrio, never the address, when the address is hidden", () => {
    const { container } = render(
      <PropertyDetailView
        property={makePublicPropertyDetail({ address: null })}
        inquiryAction={inquiryAction}
      />,
    );

    const map = within(locationSection()).getByTitle("Mapa de la ubicación");
    expect(map).toHaveAttribute("src", expect.stringContaining("Palermo%2C%20CABA"));
    expect(map).toHaveAttribute("src", expect.stringContaining("z=14"));
    // Just the map: no chip over it, neither barrio nor address.
    expect(within(locationSection()).queryByText(/Palermo/)).toBeNull();
    const note = within(locationSection()).getByText(
      "Te compartimos la dirección exacta cuando coordinemos la visita.",
    );
    // The note comes before the map, so nobody reads the barrio pin as the address.
    expect(note.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.innerHTML).not.toContain("Gorriti");
  });
});

describe("PropertyDetailView preview mode", () => {
  it("renders no inquiry form or WhatsApp bar and no link out to the public site", () => {
    const { container } = render(
      <PropertyDetailView property={makePublicPropertyDetail()} preview />,
    );

    expect(container.querySelector("form")).toBeNull();
    expect(screen.queryByRole("link", { name: /WhatsApp/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Ver más propiedades/ })).toBeNull();
    expect(
      screen.getByText(/En la vista previa no se envían consultas/),
    ).toBeInTheDocument();
    // The listing itself still renders as the public page does.
    expect(
      screen.getByRole("heading", { level: 1, name: "Luminoso 3 ambientes con balcón al frente" }),
    ).toBeInTheDocument();
    expect(screen.getByTitle("Mapa de la ubicación")).toBeInTheDocument();
  });

  it("keeps the inquiry form on the public page", () => {
    const { container } = render(
      <PropertyDetailView property={makePublicPropertyDetail()} inquiryAction={inquiryAction} />,
    );

    expect(container.querySelector("form")).not.toBeNull();
  });
});

describe("PropertyDetailView price row", () => {
  it("puts only the share button next to the price, hidden in preview", () => {
    const { rerender } = render(
      <PropertyDetailView property={makePublicPropertyDetail()} inquiryAction={inquiryAction} />,
    );
    const share = screen.getByRole("button", { name: "Compartir" });
    // ShareButton wraps the button in a span; the row is the nearest div.
    const priceRow = share.closest("div") as HTMLElement;
    expect(priceRow).toHaveTextContent("US$ 185.000");
    expect(within(priceRow).getAllByRole("button")).toEqual([share]);
    expect(screen.queryByRole("group", { name: /Guardar/ })).toBeNull();

    rerender(<PropertyDetailView property={makePublicPropertyDetail()} preview />);
    expect(screen.queryByRole("button", { name: "Compartir" })).toBeNull();
  });

  it("groups the numbers first (price, expenses, specs), then title and location", () => {
    render(<PropertyDetailView property={makePublicPropertyDetail()} inquiryAction={inquiryAction} />);

    const specs = screen.getByRole("list", { name: "Características principales" });
    const title = screen.getByRole("heading", { level: 1 });
    const expenses = screen.getAllByText(/expensas/i)[0];
    const follows = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

    expect(follows(expenses, specs)).toBe(true);
    expect(follows(specs, title)).toBe(true);
  });
});

describe("PropertyDetailView contact bar and extras", () => {
  it("keeps price and expenses in the phone bar, with WhatsApp and Llamar icons and no code", () => {
    render(<PropertyDetailView property={makePublicPropertyDetail()} inquiryAction={inquiryAction} />);

    const bar = screen.getByRole("group", { name: "Contactar por esta propiedad" });
    expect(within(bar).getAllByRole("link")).toHaveLength(2);
    expect(within(bar).getByText("US$ 185.000")).toBeInTheDocument();
    expect(within(bar).getByText("+ $ 145.000 expensas")).toBeInTheDocument();
    expect(bar).not.toHaveTextContent(/Cód\./);
    // Icon-only buttons: the accessible name carries the action.
    expect(within(bar).getByRole("link", { name: "WhatsApp" })).not.toHaveTextContent("WhatsApp");

    const whatsapp = screen.getByRole("link", { name: "WhatsApp" });
    expect(whatsapp).toHaveAttribute("href", expect.stringContaining("wa.me"));
    expect(whatsapp).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByRole("link", { name: "Llamar" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^tel:\+/),
    );
  });

  it("offers WhatsApp and the phone, with the founder's name, below the form", () => {
    render(<PropertyDetailView property={makePublicPropertyDetail()} inquiryAction={inquiryAction} />);

    const aside = screen.getByRole("complementary", { name: "Consultá por esta propiedad" });
    // The price already sits in the left column; the card is only for contact.
    expect(aside).not.toHaveTextContent("US$");
    expect(within(aside).getByRole("link", { name: /Escribir por WhatsApp/ })).toHaveAttribute(
      "href",
      expect.stringContaining("wa.me"),
    );
    expect(within(aside).getByText(/Llamá a Gabriel/)).toBeInTheDocument();
    expect(within(aside).getByRole("link", { name: "11 3896-7363" })).toHaveAttribute(
      "href",
      "tel:+5491138967363",
    );
  });

  it("shows no phone bar in preview", () => {
    render(<PropertyDetailView property={makePublicPropertyDetail()} preview />);

    expect(screen.queryByRole("link", { name: "WhatsApp" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Llamar" })).toBeNull();
    expect(screen.queryByRole("link", { name: /Escribir por WhatsApp/ })).toBeNull();
  });

  it("links the map to Google Maps in a new tab on the public page", () => {
    render(<PropertyDetailView property={makePublicPropertyDetail()} inquiryAction={inquiryAction} />);

    const link = within(locationSection()).getByRole("link", { name: /Ver en Google Maps/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=Gorriti%204800%2C%20Palermo%2C%20CABA",
    );
  });

  it("renders an ALL CAPS stored title in title case (display only)", () => {
    render(
      <PropertyDetailView
        property={makePublicPropertyDetail({ title: "PH AVENIDA BOEDO 123 FRENTE A LA PLAZA" })}
        inquiryAction={inquiryAction}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "PH Avenida Boedo 123 Frente a la Plaza" }),
    ).toBeInTheDocument();
  });
});
