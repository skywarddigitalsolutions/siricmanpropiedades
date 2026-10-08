import { afterEach, describe, expect, it } from "vitest";
import { cleanup, isInaccessible, render, screen } from "@testing-library/react";
import { WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE, buildWhatsAppLink } from "@/lib/whatsapp";
import OwnerHero from "./OwnerHero";

afterEach(() => cleanup());

const TITLE = "Vendé tu propiedad con alguien que la cuide como propia.";
const SUBTITLE =
  "Tasación profesional, un plan de venta a medida y acompañamiento hasta la escritura. Te atiende Gabriel Siricman, corredor inmobiliario matriculado.";

describe("OwnerHero", () => {
  it("is a section named by its seller-focused heading", () => {
    render(<OwnerHero />);

    const heading = screen.getByRole("heading", { level: 1, name: TITLE });
    expect(screen.getByRole("region", { name: TITLE })).toContainElement(heading);
  });

  it("shows the eyebrow and the subtitle that names Gabriel", () => {
    render(<OwnerHero />);

    expect(screen.getByText("PROPIETARIOS · CABA")).toBeInTheDocument();
    expect(screen.getByText(SUBTITLE)).toBeInTheDocument();
  });

  it("never speaks of renting in the hero", () => {
    render(<OwnerHero />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(section.textContent).not.toMatch(/alquil/i);
  });

  it("leads with a primary call to action to the selling page", () => {
    render(<OwnerHero />);

    expect(screen.getByRole("link", { name: "Quiero vender mi propiedad" })).toHaveAttribute(
      "href",
      "/vender",
    );
  });

  it("offers WhatsApp as the secondary call to action with the seller message", () => {
    render(<OwnerHero />);

    const whatsapp = screen.getByRole("link", { name: "Hablar por WhatsApp" });
    expect(whatsapp).toHaveAttribute(
      "href",
      buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE),
    );
    expect(whatsapp).toHaveAttribute("target", "_blank");
    expect(whatsapp).toHaveAttribute("rel", "noopener noreferrer");
    expect(WHATSAPP_SELLER_MESSAGE).toBe(
      "Hola Gabriel, quiero vender mi propiedad y me gustaría asesorarme.",
    );
  });

  it("no longer sends owners to the listings", () => {
    render(<OwnerHero />);

    expect(screen.queryByRole("link", { name: "Ver propiedades" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Quiero vender mi propiedad",
      "Hablar por WhatsApp",
    ]);
  });

  it("shows the owner photo as a decorative backdrop", () => {
    const { container } = render(<OwnerHero />);

    const photo = container.querySelector('img[alt=""]');
    expect(photo).not.toBeNull();
    expect(decodeURIComponent(photo!.getAttribute("src")!)).toContain("/hero-owner.jpg");
    // Decorative: no accessible image is exposed to assistive tech.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("keeps the copy and both calls to action together in the hero card", () => {
    render(<OwnerHero />);

    const section = screen.getByRole("region", { name: TITLE });
    const heading = screen.getByRole("heading", { level: 1 });
    const card = heading.parentElement!;
    expect(section).toContainElement(card);
    for (const element of [
      screen.getByText("PROPIETARIOS · CABA"),
      screen.getByText(SUBTITLE),
      screen.getByRole("link", { name: "Quiero vender mi propiedad" }),
      screen.getByRole("link", { name: "Hablar por WhatsApp" }),
    ]) {
      expect(card).toContainElement(element);
    }
    // The photo sits behind the card, not inside it.
    expect(card.querySelector("img")).toBeNull();
  });

  it("shows a location pill that assistive tech does not announce twice", () => {
    render(<OwnerHero />);

    const office = screen.getByText("Oficina en Boedo · CABA");
    // The footer and contact page already give the office address.
    expect(isInaccessible(office)).toBe(true);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("no longer shows the agency branding chip over the photo", () => {
    const { container } = render(<OwnerHero />);

    expect(screen.queryByText("Siricman Propiedades")).not.toBeInTheDocument();
    expect(container.querySelector('img[src*="logo-emblem"]')).toBeNull();
  });
});
