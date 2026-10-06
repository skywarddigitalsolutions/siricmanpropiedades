import { afterEach, describe, expect, it } from "vitest";
import { cleanup, isInaccessible, render, screen } from "@testing-library/react";
import OwnerHero from "./OwnerHero";

afterEach(() => cleanup());

describe("OwnerHero", () => {
  it("is a section named by its owner-focused heading", () => {
    render(<OwnerHero />);

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Tu propiedad, en manos profesionales.",
    });
    expect(screen.getByRole("region", { name: "Tu propiedad, en manos profesionales." })).toContainElement(
      heading,
    );
  });

  it("shows the eyebrow and subtitle, without a question hook", () => {
    render(<OwnerHero />);

    expect(screen.getByText("PROPIETARIOS · CABA")).toBeInTheDocument();
    expect(
      screen.getByText("Asesoramiento integral para vender o alquilar, con un corredor matriculado."),
    ).toBeInTheDocument();
    expect(screen.queryByText("¿Cuánto vale tu propiedad hoy?")).not.toBeInTheDocument();
  });

  it("links the primary call to action to the appraisal page", () => {
    render(<OwnerHero />);

    expect(screen.getByRole("link", { name: "Pedí tu tasación" })).toHaveAttribute("href", "/tasaciones");
  });

  it("offers buyers a secondary call to action to the listings", () => {
    render(<OwnerHero />);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Pedí tu tasación", "Ver propiedades"]);
    expect(screen.getByRole("link", { name: "Ver propiedades" })).toHaveAttribute("href", "/propiedades");
  });

  it("leaves WhatsApp to the site-wide floating button", () => {
    render(<OwnerHero />);

    expect(screen.queryByRole("link", { name: /WhatsApp/ })).not.toBeInTheDocument();
  });

  it("shows the owner photo as a decorative backdrop", () => {
    const { container } = render(<OwnerHero />);

    const photo = container.querySelector('img[alt=""]');
    expect(photo).not.toBeNull();
    expect(decodeURIComponent(photo!.getAttribute("src")!)).toContain("/hero-owner.jpg");
    // Decorative: no accessible image is exposed to assistive tech.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("keeps the copy and both calls to action together in the hero section", () => {
    render(<OwnerHero />);

    const section = screen.getByRole("region", { name: "Tu propiedad, en manos profesionales." });
    const heading = screen.getByRole("heading", { level: 1 });
    const card = heading.parentElement!;
    expect(section).toContainElement(card);
    for (const element of [
      screen.getByText("PROPIETARIOS · CABA"),
      screen.getByText("Asesoramiento integral para vender o alquilar, con un corredor matriculado."),
      screen.getByRole("link", { name: "Pedí tu tasación" }),
      screen.getByRole("link", { name: "Ver propiedades" }),
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
