import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE, buildWhatsAppLink } from "@/lib/whatsapp";
import SellerCta from "./SellerCta";

afterEach(() => cleanup());

const TITLE = "¿Pensás vender tu propiedad?";

describe("SellerCta", () => {
  it("is a section named by its heading, with the invitation text", () => {
    render(<SellerCta />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(within(section).getByRole("heading", { level: 2, name: TITLE })).toBeInTheDocument();
    expect(
      within(section).getByText("Pedí tu tasación y conversemos sin compromiso."),
    ).toBeInTheDocument();
  });

  it("offers the appraisal request and WhatsApp with the seller message", () => {
    render(<SellerCta />);

    expect(screen.getByRole("link", { name: "Pedí tu tasación" })).toHaveAttribute("href", "/vender");
    const whatsapp = screen.getByRole("link", { name: "Escribinos por WhatsApp" });
    expect(whatsapp).toHaveAttribute("href", buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE));
    expect(whatsapp).toHaveAttribute("target", "_blank");
    expect(whatsapp).toHaveAttribute("rel", "noopener noreferrer");
  });
});
