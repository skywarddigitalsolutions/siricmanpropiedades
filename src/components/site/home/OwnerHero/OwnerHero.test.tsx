import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE, buildWhatsAppLink } from "@/lib/whatsapp";
import OwnerHero from "./OwnerHero";

afterEach(() => cleanup());

const TITLE = "Vendé tu propiedad con alguien que la cuide como propia.";
const SUBTITLE =
  "Tasación profesional, un plan de venta a medida y acompañamiento hasta la escritura. Te atiende Gabriel Siricman, corredor inmobiliario matriculado.";

const SHORT_SUBTITLE = "Tasación, plan de venta y acompañamiento hasta la escritura.";

describe("OwnerHero", () => {
  it("offers a short subtitle for phones next to the full one", () => {
    render(<OwnerHero />);

    // CSS shows one per breakpoint; both live inside the same paragraph.
    const short = screen.getByText(SHORT_SUBTITLE);
    expect(short.parentElement).toBe(screen.getByText(SUBTITLE).parentElement);
    expect(short.parentElement!.tagName).toBe("P");
  });

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

    const whatsapp = screen.getByRole("link", { name: /escribinos por WhatsApp/i });
    expect(whatsapp).toHaveAttribute(
      "href",
      buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE),
    );
    expect(whatsapp).toHaveAttribute("target", "_blank");
    expect(whatsapp).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("no longer sends owners to the listings", () => {
    render(<OwnerHero />);

    expect(screen.queryByRole("link", { name: "Ver propiedades" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Quiero vender mi propiedad",
      "o escribinos por WhatsApp",
    ]);
  });

  it("shows the aerial city photo as a decorative backdrop", () => {
    const { container } = render(<OwnerHero />);

    const photo = container.querySelector('img[alt=""]');
    expect(photo).not.toBeNull();
    expect(decodeURIComponent(photo!.getAttribute("src")!)).toContain("/hero.jpg");
    // Decorative: no accessible image is exposed to assistive tech.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("puts the copy straight on the photo, with a navy overlay and no card", () => {
    const { container } = render(<OwnerHero />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(container.querySelector('[class*="card"]')).toBeNull();
    expect(container.querySelector('[class*="overlay"]')).not.toBeNull();
    expect(container.querySelector('img[src*="hero-owner"]')).toBeNull();
    expect(heading.parentElement!.querySelector("img")).toBeNull();
  });

  it("keeps the copy and both calls to action together in one content block", () => {
    render(<OwnerHero />);

    const section = screen.getByRole("region", { name: TITLE });
    const heading = screen.getByRole("heading", { level: 1 });
    const card = heading.parentElement!;
    expect(section).toContainElement(card);
    for (const element of [
      screen.getByText("PROPIETARIOS · CABA"),
      screen.getByText(SUBTITLE),
      screen.getByRole("link", { name: "Quiero vender mi propiedad" }),
      screen.getByRole("link", { name: /escribinos por WhatsApp/i }),
    ]) {
      expect(card).toContainElement(element);
    }
    // The photo sits behind the card, not inside it.
    expect(card.querySelector("img")).toBeNull();
  });

  it("no longer shows the agency branding chip over the photo", () => {
    const { container } = render(<OwnerHero />);

    expect(screen.queryByText("Siricman Propiedades")).not.toBeInTheDocument();
    expect(container.querySelector('img[src*="logo-emblem"]')).toBeNull();
  });

  describe("styles", () => {
    const css = readFileSync(join(__dirname, "OwnerHero.module.css"), "utf8");
    const desktop = css.slice(css.indexOf("@media (min-width: 960px)"));

    it("centers the whole content on desktop", () => {
      expect(desktop).toMatch(/\.content\s*{[^}]*align-items:\s*center/);
      expect(desktop).toMatch(/\.content\s*{[^}]*text-align:\s*center/);
      expect(desktop).toMatch(/\.actions\s*{[^}]*justify-content:\s*center/);
    });

    it("lets the title break into two balanced lines on desktop", () => {
      expect(desktop).toMatch(/\.title\s*{[^}]*max-width:\s*2[2-6]ch/);
      expect(css).toMatch(/\.title\s*{[^}]*text-wrap:\s*balance/);
    });

    it("makes the primary call to action stand out in navy with white text", () => {
      const primary = css.match(/\.primary\s*{[^}]*}/)![0];
      expect(primary).toContain("background: var(--color-navy)");
      expect(primary).toContain("color: var(--color-white)");
    });

    it("keeps hover states navy and white, never the global gold link color", () => {
      expect(css).toMatch(/\.primary:hover\s*{[^}]*color:\s*var\(--color-white\)/);
      expect(css).toMatch(/\.secondary:hover\s*{[^}]*background:\s*var\(--color-navy\)/);
      expect(css).toMatch(/\.secondary:hover\s*{[^}]*color:\s*var\(--color-white\)/);
    });

    it("uses a neutral dark overlay instead of the saturated navy scrim", () => {
      const overlay = css.match(/\.overlay\s*{[^}]*}/)![0];
      expect(overlay).toContain("rgba(12, 16, 32");
      expect(overlay).not.toContain("navy-scrim");
    });
  });
});
