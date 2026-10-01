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
    expect(within(locationSection()).getByText("Gorriti 4800, Palermo")).toBeInTheDocument();
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
    expect(within(locationSection()).getByText("Zona aproximada · Palermo")).toBeInTheDocument();
    expect(
      screen.getByText("Te compartimos la dirección exacta cuando coordinemos la visita."),
    ).toBeInTheDocument();
    expect(container.innerHTML).not.toContain("Gorriti");
  });
});

describe("PropertyDetailView preview mode", () => {
  it("renders no inquiry form or WhatsApp bar and no link out to the public site", () => {
    const { container } = render(
      <PropertyDetailView property={makePublicPropertyDetail()} preview />,
    );

    expect(container.querySelector("form")).toBeNull();
    expect(screen.queryByLabelText("Consultar por WhatsApp")).toBeNull();
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

describe("PropertyDetailView favorites", () => {
  it("offers a labeled Guardar toggle, hidden in preview", () => {
    const { rerender } = render(
      <PropertyDetailView property={makePublicPropertyDetail()} inquiryAction={inquiryAction} />,
    );
    expect(screen.getByRole("button", { name: "Guardar en favoritos" })).toHaveTextContent("Guardar");

    rerender(<PropertyDetailView property={makePublicPropertyDetail()} preview />);
    expect(screen.queryByRole("button", { name: /favoritos/ })).toBeNull();
  });
});
