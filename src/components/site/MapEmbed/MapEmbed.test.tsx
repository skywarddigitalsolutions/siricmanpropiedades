import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import MapEmbed from "./MapEmbed";

afterEach(() => cleanup());

describe("MapEmbed", () => {
  it("renders a lazy, titled iframe pointing at the map query", () => {
    render(<MapEmbed query="Las Casas 4054, Boedo, CABA" title="Mapa de la oficina" />);

    const frame = screen.getByTitle("Mapa de la oficina");
    expect(frame.tagName).toBe("IFRAME");
    expect(frame).toHaveAttribute("loading", "lazy");
    expect(frame).toHaveAttribute("referrerpolicy", "no-referrer-when-downgrade");
    expect(frame).toHaveAttribute(
      "src",
      "https://www.google.com/maps?q=Las%20Casas%204054%2C%20Boedo%2C%20CABA&output=embed&z=16",
    );
  });

  it("uses the approximate zoom and shows the chip label when given", () => {
    render(<MapEmbed query="Palermo, CABA" title="Mapa" precision="approximate" label="Zona aproximada" />);

    expect(screen.getByTitle("Mapa")).toHaveAttribute("src", expect.stringContaining("&z=14"));
    expect(screen.getByText("Zona aproximada")).toBeInTheDocument();
  });

  it("omits the chip without a label", () => {
    const { container } = render(<MapEmbed query="Palermo, CABA" title="Mapa" />);

    expect(container.querySelector("span")).toBeNull();
  });
});
