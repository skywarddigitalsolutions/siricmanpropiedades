import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import ManagementSection from "./ManagementSection";

afterEach(() => cleanup());

const TITLE = "Nos ocupamos de tu propiedad, todos los meses";
const RENTALS = "Administración de alquileres";
const CONSORTIUMS = "Administración de consorcios";

function getBlock(name: string) {
  const section = screen.getByRole("region", { name: TITLE });
  return within(section).getByRole("article", { name });
}

describe("ManagementSection", () => {
  it("is a section named by its heading, with an eyebrow and a lead", () => {
    render(<ManagementSection />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(within(section).getByRole("heading", { level: 2, name: TITLE })).toBeInTheDocument();
    expect(within(section).getByText("ADMINISTRACIÓN")).toBeInTheDocument();
    expect(
      within(section).getByText(
        "Un equipo con más de 11 años administrando edificios en CABA, ahora también a cargo de tu alquiler.",
      ),
    ).toBeInTheDocument();
  });

  it("presents the two services, each titled by a level-3 heading", () => {
    render(<ManagementSection />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(
      within(section)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual([RENTALS, CONSORTIUMS]);
  });

  it("lists three benefits per service", () => {
    render(<ManagementSection />);

    expect(
      within(getBlock(RENTALS))
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual([
      "Cobranza mensual y rendición de cuentas",
      "Ajustes de contrato y renovaciones",
      "Mantenimiento y relación con el inquilino",
    ]);
    expect(
      within(getBlock(CONSORTIUMS))
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual([
      "Liquidación de expensas y cobranza",
      "Proveedores y mantenimiento",
      "Asambleas y atención a propietarios",
    ]);
  });

  it("keeps each service to its title, text and benefits, without its own links", () => {
    render(<ManagementSection />);

    for (const name of [RENTALS, CONSORTIUMS]) {
      expect(within(getBlock(name)).queryAllByRole("link")).toHaveLength(0);
    }
  });

  it("offers a single WhatsApp contact for the section that opens in a new tab", () => {
    render(<ManagementSection />);

    const section = screen.getByRole("region", { name: TITLE });
    const whatsapp = within(section)
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("https://wa.me/"));
    expect(whatsapp).toHaveLength(1);
    expect(whatsapp[0]).toHaveAccessibleName("Consultar por WhatsApp");
    expect(whatsapp[0]).toHaveAttribute(
      "href",
      buildWhatsAppLink(
        WHATSAPP_PHONE,
        "Hola! Quiero consultar por la administración de mi propiedad.",
      ),
    );
    expect(whatsapp[0]).toHaveAttribute("target", "_blank");
    expect(whatsapp[0]).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("links to the consortium administration page", () => {
    render(<ManagementSection />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(
      within(section).getByRole("link", { name: "Conocé administración de consorcios" }),
    ).toHaveAttribute("href", "/administracion-de-consorcios");
  });
});
