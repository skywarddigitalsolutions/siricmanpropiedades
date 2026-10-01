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
